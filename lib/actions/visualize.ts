'use server';

import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/database/mongodb';
import { VisualizationModel, UserUsageModel, UserModel } from '@/lib/database/models';
import { selectVisualizationFormat } from '@/lib/services/format-selector';
import { expandNetworkNode, expandMindMapNode, generateVisualizationData, VisualizationGeneratorService } from '@/lib/services/visualization-generator';
import { calculateCost, sanitizeVisualization } from '@/lib/utils/helpers';
import { FORMAT_INFO } from '@/lib/types/visualization';
import {
  validateInputLength,
  validateObjectId,
  validateDataSize,
  validateArraySize,
  validateTitle,
  sanitizeError,
  VALIDATION_LIMITS,
  TOKEN_COSTS,
  calcInternalTokens,
} from '@/lib/utils/validation';
import { checkTokenBalance, deductTokens, getTokenBalance } from '@/lib/utils/tokens';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { getCachedVisualization, setCachedVisualization } from '@/lib/utils/cache';
import type {
  VisualizationType,
  VisualizationResponse,
  VisualizationData,
  VisualizationMetadata,
} from '@/lib/types/visualization';

/**
 * Generate a new visualization from user input
 */
export async function generateVisualization(
  input: string,
  preferredFormat?: VisualizationType
): Promise<VisualizationResponse> {
  const startTime = Date.now();

  const fail = (error: string, reason = ''): VisualizationResponse => ({
    success: false, type: 'network_graph', data: {} as VisualizationData, reason, error,
  });

  try {
    const inputValidation = validateInputLength(input);
    if (!inputValidation.valid) return fail(inputValidation.error || 'Invalid input');

    const { userId } = await auth();
    if (!userId) return fail('Authentication required');

    // ── Rate limiting (before any DB / AI work) ──────────────────────────────
    const rateCheck = await checkRateLimit(userId, 'generate');
    if (!rateCheck.allowed) {
      return fail(
        `Too many requests. Please wait ${rateCheck.retryAfter ?? 60} seconds before trying again.`
      );
    }

    // ── Determine format ─────────────────────────────────────────────────────
    let format: VisualizationType;
    let reason: string;

    if (preferredFormat) {
      format = preferredFormat;
      reason = 'User selected this format manually';
    } else {
      const formatSelection = await selectVisualizationFormat(input);
      if (!formatSelection.visualizable || formatSelection.format === 'none') {
        return fail('This content is not suitable for visualization', formatSelection.reason);
      }
      format = formatSelection.format;
      reason = formatSelection.reason;
    }

    // ── Token balance check (always — cache benefit is speed, not free usage) ─
    await connectToDatabase();

    const tokenCheck = await checkTokenBalance(userId, TOKEN_COSTS.GENERATE_VISUALIZATION);
    if (!tokenCheck.allowed) return fail(tokenCheck.error || 'Insufficient tokens');

    // ── Cache lookup (instant result, tokens still charged) ───────────────────
    const cached = await getCachedVisualization(input, format);
    if (cached) {
      await deductTokens(userId, TOKEN_COSTS.GENERATE_VISUALIZATION);
      await Promise.all([
        UserUsageModel.updateOne({ userId }, { $inc: { visualizationsCreated: 1 } }),
        UserModel.updateOne({ clerkId: userId }, { $inc: { usageCount: 1 } }),
      ]);

      return {
        success: true,
        type: format,
        data: cached,
        reason,
        fromCache: true,
        metadata: {
          generatedAt: new Date(),
          processingTime: Date.now() - startTime,
          aiModel: 'cached',
          cost: 0,
          originalInput: input,
        },
      };
    }

    // ── Generate with AI ─────────────────────────────────────────────────────
    const { data, promptTokens, completionTokens } = await generateVisualizationData(format, input);

    // ── Store in cache (fire-and-forget, not on the critical path) ────────────
    setCachedVisualization(input, format, data).catch(() => {});

    // ── Deduct actual token cost based on real OpenAI usage ───────────────────
    const actualCost = calcInternalTokens(promptTokens, completionTokens);
    const deduction = await deductTokens(userId, actualCost);
    if (!deduction.success) {
      console.error(`[billing] deductTokens failed for userId=${userId} cost=${actualCost}: ${deduction.error}`);
    }
    await Promise.all([
      UserUsageModel.updateOne({ userId }, { $inc: { visualizationsCreated: 1 } }),
      UserModel.updateOne({ clerkId: userId }, { $inc: { usageCount: 1 } }),
    ]);

    const processingTime = Date.now() - startTime;
    const formatInfo = FORMAT_INFO[format];

    return {
      success: true,
      type: format,
      data,
      reason,
      fromCache: false,
      metadata: {
        generatedAt: new Date(),
        processingTime,
        aiModel: 'gpt-5.4-mini',
        cost: calculateCost(input.length, formatInfo.estimatedCost),
        originalInput: input,
      },
    };
  } catch (error) {
    console.error('Error generating visualization:', error);
    return fail(sanitizeError(error, 'Failed to generate visualization'));
  }
}
export async function expandNodeAction(
  nodeId: string,
  nodeLabel: string,
  originalInput: string,
  existingNodeLabels: string[]
) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Authentication required' };

    const rateCheck = await checkRateLimit(userId, 'expand');
    if (!rateCheck.allowed) {
      return { success: false, error: `Too many requests. Please wait ${rateCheck.retryAfter ?? 60} seconds.` };
    }

    // SECURITY: Validate inputs
    const labelValidation = validateInputLength(nodeLabel, VALIDATION_LIMITS.MAX_NODE_LABEL_LENGTH);
    if (!labelValidation.valid) {
      return { success: false, error: labelValidation.error };
    }

    const inputValidation = validateInputLength(originalInput);
    if (!inputValidation.valid) {
      return { success: false, error: inputValidation.error };
    }

    const arrayValidation = validateArraySize(existingNodeLabels, VALIDATION_LIMITS.MAX_EXISTING_NODES_ARRAY);
    if (!arrayValidation.valid) {
      return { success: false, error: arrayValidation.error };
    }

    await connectToDatabase();

    // TOKEN SYSTEM: Check if user has enough tokens
    const tokenCheck = await checkTokenBalance(userId, TOKEN_COSTS.EXPAND_NODE);
    if (!tokenCheck.allowed) {
      return {
        success: false,
        error: tokenCheck.error || 'Insufficient tokens'
      };
    }

    // Call the AI service to get new nodes
    const { data: newData, promptTokens, completionTokens } = await expandNetworkNode(nodeLabel, nodeId, originalInput, existingNodeLabels);

    // Deduct actual token cost based on real OpenAI usage
    const actualCost = calcInternalTokens(promptTokens, completionTokens);
    const deduction = await deductTokens(userId, actualCost);
    if (!deduction.success) {
      console.error(`[billing] deductTokens failed for userId=${userId} cost=${actualCost}: ${deduction.error}`);
    }

    await Promise.all([
      UserUsageModel.updateOne({ userId }, { $inc: { visualizationsCreated: 1 } }),
      UserModel.updateOne({ clerkId: userId }, { $inc: { usageCount: 1 } }),
    ]);

    return { success: true, data: newData };
  } catch (error) {
    console.error('Error expanding node:', error);
    return { success: false, error: sanitizeError(error, 'Failed to expand node') };
  }
}

/**
 * Expand a mind map node with AI-generated children
 */
export async function expandMindMapNodeAction(
  nodeId: string,
  nodeContent: string,
  originalInput: string,
  existingNodeIds: string[]
) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Authentication required' };

    const rateCheck = await checkRateLimit(userId, 'expand');
    if (!rateCheck.allowed) {
      return { success: false, error: `Too many requests. Please wait ${rateCheck.retryAfter ?? 60} seconds.` };
    }

    // SECURITY: Validate inputs
    const contentValidation = validateInputLength(nodeContent, VALIDATION_LIMITS.MAX_NODE_LABEL_LENGTH);
    if (!contentValidation.valid) {
      return { success: false, error: contentValidation.error };
    }

    const inputValidation = validateInputLength(originalInput);
    if (!inputValidation.valid) {
      return { success: false, error: inputValidation.error };
    }

    const arrayValidation = validateArraySize(existingNodeIds, VALIDATION_LIMITS.MAX_EXISTING_NODES_ARRAY);
    if (!arrayValidation.valid) {
      return { success: false, error: arrayValidation.error };
    }

    await connectToDatabase();

    // TOKEN SYSTEM: Check if user has enough tokens
    const tokenCheck = await checkTokenBalance(userId, TOKEN_COSTS.EXPAND_NODE);
    if (!tokenCheck.allowed) {
      return {
        success: false,
        error: tokenCheck.error || 'Insufficient tokens'
      };
    }

    // Call the AI service to get new child nodes
    const { data: newNodes, promptTokens, completionTokens } = await expandMindMapNode(nodeId, nodeContent, originalInput, existingNodeIds);

    // Deduct actual token cost based on real OpenAI usage
    const actualCost = calcInternalTokens(promptTokens, completionTokens);
    const deduction = await deductTokens(userId, actualCost);
    if (!deduction.success) {
      console.error(`[billing] deductTokens failed for userId=${userId} cost=${actualCost}: ${deduction.error}`);
    }

    await Promise.all([
      UserUsageModel.updateOne({ userId }, { $inc: { visualizationsCreated: 1 } }),
      UserModel.updateOne({ clerkId: userId }, { $inc: { usageCount: 1 } }),
    ]);

    return { success: true, data: newNodes };
  } catch (error) {
    console.error('Error expanding mind map node:', error);
    return { success: false, error: sanitizeError(error, 'Failed to expand mind map node') };
  }
}

/**
 * Edit an existing visualization
 */
export async function editVisualizationAction(
  editPrompt: string,
  existingData: VisualizationData,
  visualizationType: VisualizationType,
  visualizationId?: string,
  messages?: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date | string }>
) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Authentication required' };

    const rateCheck = await checkRateLimit(userId, 'edit');
    if (!rateCheck.allowed) {
      return { success: false, error: `Too many requests. Please wait ${rateCheck.retryAfter ?? 60} seconds.` };
    }

    // SECURITY: Validate inputs
    const promptValidation = validateInputLength(editPrompt);
    if (!promptValidation.valid) {
      return { success: false, error: promptValidation.error };
    }

    const dataValidation = validateDataSize(existingData, VALIDATION_LIMITS.MAX_EDIT_DATA_SIZE);
    if (!dataValidation.valid) {
      return { success: false, error: dataValidation.error };
    }

    if (visualizationId) {
       const idValidation = validateObjectId(visualizationId);
       if (!idValidation.valid) {
         return { success: false, error: idValidation.error };
       }
    }

    await connectToDatabase();

    // TOKEN SYSTEM: Check if user has enough tokens
    const tokenCheck = await checkTokenBalance(userId, TOKEN_COSTS.EDIT_VISUALIZATION);
    if (!tokenCheck.allowed) {
      return {
        success: false,
        error: tokenCheck.error || 'Insufficient tokens'
      };
    }

    // Instantiate service and edit
    const service = new VisualizationGeneratorService();
    // Use messages for context if provided
    const contextHistory = messages ? messages.map(m => ({ role: m.role, content: m.content })) : [];

    const result = await service.editVisualization(
      visualizationType,
      existingData,
      editPrompt,
      contextHistory
    );

    // Deduct actual token cost based on real OpenAI usage
    const actualCost = calcInternalTokens(result.promptTokens, result.completionTokens);
    const deduction = await deductTokens(userId, actualCost);
    if (!deduction.success) {
      console.error(`[billing] deductTokens failed for userId=${userId} cost=${actualCost}: ${deduction.error}`);
    }

    await Promise.all([
      UserUsageModel.updateOne({ userId }, { $inc: { visualizationsCreated: 1 } }),
      UserModel.updateOne({ clerkId: userId }, { $inc: { usageCount: 1 } }),
    ]);

    let updatedVisualization: any = null;

    // If data was modified and we have an ID, update the database
    if (result.data && visualizationId) {
       const visualization = await VisualizationModel.findOne({ _id: visualizationId, userId });

       if (visualization) {
         visualization.data = result.data;
         visualization.updatedAt = new Date();

         // Update history — messages already includes the new user message, so only append assistant reply
         if (messages) {
            const historyItems: { role: "user" | "assistant"; content: string; timestamp: Date }[] = [
                ...messages.map(h => ({
                    role: h.role as "user" | "assistant",
                    content: h.content,
                    timestamp: typeof h.timestamp === 'string' ? new Date(h.timestamp) : h.timestamp
                })),
                { role: 'assistant' as const, content: result.message, timestamp: new Date() }
            ];
            visualization.history = historyItems;
         }

         await visualization.save();

         // Manually sanitize to return a plain object
         updatedVisualization = sanitizeVisualization(visualization);
       }
    }

    return {
      success: true,
      message: result.message,
      data: result.data, // This is the updated data payload (or null if just a question)
      visualization: updatedVisualization
    };

  } catch (error) {
    console.error('Error editing visualization:', error);
    return { success: false, error: sanitizeError(error, 'Failed to edit visualization') };
  }
}

/**
 * Save a visualization to database
 */
export async function saveVisualization(
  title: string,
  type: VisualizationType,
  data: VisualizationData,
  metadata: VisualizationMetadata,
  isPublic: boolean = false,
  id?: string,
  history?: { role: 'user' | 'assistant'; content: string; timestamp: Date | string }[]
): Promise<{ success: boolean; id?: string; error?: string; data?: any }> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // SECURITY: Validate title
    const titleValidation = validateTitle(title);
    if (!titleValidation.valid) {
      return { success: false, error: titleValidation.error };
    }

    // SECURITY: Validate data size
    const dataValidation = validateDataSize(data);
    if (!dataValidation.valid) {
      return { success: false, error: dataValidation.error };
    }

    await connectToDatabase();

    // Get user tier for storage limits
    const userUsage = await UserUsageModel.findOne({ userId });
    const tier = userUsage?.tier || 'free';

    let visualization;

    // Check if we are updating by ID
    if (id) {
       // Validate ID
       const idValidation = validateObjectId(id);
       if (!idValidation.valid) {
         return { success: false, error: idValidation.error };
       }

       visualization = await VisualizationModel.findOne({ _id: id, userId });

       if (visualization) {
         visualization.title = title; // Update title if changed
         visualization.data = data;
         visualization.metadata = metadata;
         visualization.isPublic = isPublic;
         if (history) {
           visualization.history = history.map(h => ({
             ...h,
             timestamp: typeof h.timestamp === 'string' ? new Date(h.timestamp) : h.timestamp
           }));
         }
         visualization.updatedAt = new Date();
         await visualization.save();
       } else {
         // ID provided but not found, could imply user is trying to hack or it was deleted.
         // Fallback to creating new? No, safer to error if ID was explicit.
         return { success: false, error: 'Visualization not found or unauthorized' };
       }
    } else {
      // Check for existing visualization with same title and type (Legacy behavior)
      // Only do this if we didn't search by ID.
      const existingVisualization = await VisualizationModel.findOne({
        userId,
        title,
        type,
      });

      if (existingVisualization) {
        // Update existing visualization with new data (e.g., after extending nodes)
        existingVisualization.data = data;
        existingVisualization.metadata = metadata;
        existingVisualization.isPublic = isPublic;
        if (history) {
           existingVisualization.history = history.map(h => ({
             ...h,
             timestamp: typeof h.timestamp === 'string' ? new Date(h.timestamp) : h.timestamp
           }));
        }
        existingVisualization.updatedAt = new Date();
        await existingVisualization.save();

        visualization = existingVisualization;
      } else {
        // SECURITY: Check if user exceeded max saved visualizations
        const user = await UserModel.findOrCreate(userId);
        const currentCount = user.savedVisualizations.length;
        const maxAllowed = tier === 'free'
          ? VALIDATION_LIMITS.MAX_SAVED_VISUALIZATIONS_FREE
          : VALIDATION_LIMITS.MAX_SAVED_VISUALIZATIONS_PRO;

        if (currentCount >= maxAllowed) {
          return {
            success: false,
            error: `Maximum saved visualizations limit reached (${maxAllowed}). Please delete some or upgrade your plan.`
          };
        }

        // Create new visualization
        visualization = await VisualizationModel.create({
          userId,
          title,
          type,
          data,
          metadata,
          isPublic,
          history: history ? history.map(h => ({
             ...h,
             timestamp: typeof h.timestamp === 'string' ? new Date(h.timestamp) : h.timestamp
           })) : [],
        });

        // Update user's saved visualizations for new visualization only
        const visualizationIdStr = visualization._id.toString();
        const exists = user.savedVisualizations.some(id => id.toString() === visualizationIdStr);

        if (!exists) {
          user.savedVisualizations.push(visualization._id as any);
          await user.save();
        }
      }
    }

    const sanitizedData = sanitizeVisualization(visualization);

    return { success: true, id: visualization._id.toString(), data: sanitizedData };
  } catch (error) {
    console.error('Error saving visualization:', error);
    return {
      success: false,
      error: sanitizeError(error, 'Failed to save visualization'),
    };
  }
}

/**
 * Get user's visualization history
 */
export async function getUserVisualizations(limit: number = 20) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Authentication required', data: [] };
    }

    await connectToDatabase();

    // SECURITY: Use field projection to only return necessary fields
    const visualizations = await VisualizationModel.find({ userId })
      .select('_id userId title type data metadata isPublic createdAt updatedAt history')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return {
      success: true,
      data: visualizations.map(v => sanitizeVisualization(v)),
    };
  } catch (error) {
    console.error('Error fetching visualizations:', error);
    return { success: false, error: sanitizeError(error, 'Failed to fetch visualizations'), data: [] };
  }
}

/**
 * Get a single visualization by ID
 */
export async function getVisualizationById(id: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Authentication required', data: null };
    }

    // SECURITY: Validate ObjectId format
    const idValidation = validateObjectId(id);
    if (!idValidation.valid) {
      return { success: false, error: idValidation.error, data: null };
    }

    await connectToDatabase();

    const visualization = await VisualizationModel.findOne({ _id: id, userId }).lean();

    if (!visualization) {
      return { success: false, error: 'Visualization not found', data: null };
    }

    return {
      success: true,
      data: sanitizeVisualization(visualization),
    };
  } catch (error) {
    console.error('Error fetching visualization by ID:', error);
    return { success: false, error: sanitizeError(error, 'Failed to fetch visualization'), data: null };
  }
}

/**
 * Delete a visualization
 */
export async function deleteVisualization(visualizationId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // SECURITY: Validate ObjectId format
    const idValidation = validateObjectId(visualizationId);
    if (!idValidation.valid) {
      return { success: false, error: idValidation.error };
    }

    await connectToDatabase();

    const result = await VisualizationModel.deleteOne({
      _id: visualizationId,
      userId,
    });

    if (result.deletedCount === 0) {
      return { success: false, error: 'Visualization not found or unauthorized' };
    }

    // Remove stale reference from user's savedVisualizations array
    await UserModel.findOneAndUpdate(
      { clerkId: userId },
      { $pull: { savedVisualizations: visualizationId } }
    );

    return { success: true };
  } catch (error) {
    console.error('Error deleting visualization:', error);
    return {
      success: false,
      error: sanitizeError(error, 'Failed to delete visualization'),
    };
  }
}
