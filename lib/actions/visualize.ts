'use server';

import { after } from 'next/server';
import type { Types } from 'mongoose';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/database/mongodb';
import { VisualizationModel, UserUsageModel, UserModel } from '@/lib/database/models';
import { generateChartSpec } from '@/lib/services/spec-generator';
import { editChartSpec } from '@/lib/services/spec-editor';
import { calculateCost, sanitizeVisualization } from '@/lib/utils/helpers';
import { resolveVariant } from '@/lib/utils/chart-types';
import { DEFAULT_SUNSET_THEME, type VisualizationSpec, type ChartStyleEffect } from '@/lib/types/echarts-spec';
import type { EChartsOption } from 'echarts';
import {
  validateInputLength,
  validateObjectId,
  validateDataSize,
  validateTitle,
  sanitizeError,
  VALIDATION_LIMITS,
  TOKEN_COSTS,
  calcInternalTokens,
} from '@/lib/utils/validation';
import { checkTokenBalance, deductTokens } from '@/lib/utils/tokens';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { getCachedVisualization, setCachedVisualization } from '@/lib/utils/cache';
import type {
  VisualizationResponse,
  VisualizationMetadata,
  LiveDataConfig,
  SavedVisualization,
} from '@/lib/types/visualization';

/**
 * Generate a new visualization from user input
 */
export async function generateVisualization(input: string, styleEffect?: ChartStyleEffect): Promise<VisualizationResponse> {
  const startTime = Date.now();

  const fail = (error: string, reason = ''): VisualizationResponse => ({
    success: false, reason, error,
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

    // ── Token balance check (always — cache benefit is speed, not free usage) ─
    await connectToDatabase();

    const tokenCheck = await checkTokenBalance(userId, TOKEN_COSTS.GENERATE_VISUALIZATION);
    if (!tokenCheck.allowed) return fail(tokenCheck.error || 'Insufficient tokens');

    // ── Cache lookup (instant result, tokens still charged) ───────────────────
    const cached = await getCachedVisualization(input);
    if (cached) {
      await deductTokens(userId, TOKEN_COSTS.GENERATE_VISUALIZATION);
      await Promise.all([
        UserUsageModel.updateOne({ userId }, { $inc: { visualizationsCreated: 1 } }),
        UserModel.updateOne({ clerkId: userId }, { $inc: { usageCount: 1 } }),
      ]);

      const spec: VisualizationSpec = {
        option: cached.option,
        theme: DEFAULT_SUNSET_THEME,
        title: cached.title,
        styleEffect,
      };

      return {
        success: true,
        spec,
        title: cached.title,
        reason: cached.reason,
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
    const { data, visualizable, promptTokens, completionTokens } = await generateChartSpec(input);
    if (!visualizable) {
      return fail('This content is not suitable for visualization', data.reason);
    }

    // ── Resolve variant + styleEffect ─────────────────────────────────────────
    // When the user explicitly picked a chart type via the modal, `styleEffect`
    // is already set from the modal selection. For free-text prompts it's
    // undefined — use the AI-declared seriesType/variantKey to fill the gap so
    // effects like gradient-area are applied even without the modal.
    const detectedSelection = resolveVariant(data.seriesType, data.variantKey);
    const resolvedStyleEffect: ChartStyleEffect | undefined =
      styleEffect ?? detectedSelection?.variant?.styleEffect;

    // ── Store in cache after the response — `after()` keeps the Vercel function
    // alive past the response boundary so the write is guaranteed to complete.
    after(() => setCachedVisualization(input, { title: data.title, option: data.option, reason: data.reason }).catch(() => {}));

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

    const spec: VisualizationSpec = {
      option: data.option,
      theme: DEFAULT_SUNSET_THEME,
      title: data.title,
      styleEffect: resolvedStyleEffect,
    };

    return {
      success: true,
      spec,
      title: data.title,
      reason: data.reason,
      fromCache: false,
      detectedSelection: detectedSelection ?? undefined,
      metadata: {
        generatedAt: new Date(),
        processingTime,
        aiModel: 'gpt-5.4-mini',
        cost: calculateCost(input.length),
        originalInput: input,
      },
    };
  } catch (error) {
    console.error('Error generating visualization:', error);
    return fail(sanitizeError(error, 'Failed to generate visualization'));
  }
}

/**
 * Auto-persist a freshly generated visualization as an ephemeral "session" —
 * created immediately after generation, without a "Save" click. Unlike
 * `saveVisualization`, this never counts against the saved-visualization
 * limit and expires via `sessionExpiresAt` (TTL) unless connected to a live
 * data source (which never expires).
 */
export async function createSession(
  title: string,
  spec: VisualizationSpec,
  metadata: VisualizationMetadata,
  history?: { role: 'user' | 'assistant'; content: string; timestamp: Date | string }[],
  liveData?: LiveDataConfig | null
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Authentication required' };

    const titleValidation = validateTitle(title);
    if (!titleValidation.valid) return { success: false, error: titleValidation.error };

    const dataValidation = validateDataSize(spec);
    if (!dataValidation.valid) return { success: false, error: dataValidation.error };

    await connectToDatabase();

    const sessionExpiresAt = liveData?.url ? undefined : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const visualization = await VisualizationModel.create({
      userId,
      title: titleValidation.sanitized,
      spec,
      metadata,
      isPublic: false,
      isSaved: false,
      sessionExpiresAt,
      ...(liveData?.url ? { liveData } : {}),
      history: (history || []).map(h => ({
        ...h,
        timestamp: typeof h.timestamp === 'string' ? new Date(h.timestamp) : h.timestamp,
      })),
    });

    return { success: true, id: visualization._id.toString() };
  } catch (error) {
    console.error('Error creating session:', error);
    return { success: false, error: sanitizeError(error, 'Failed to create session') };
  }
}

/**
 * Edit an existing visualization's chart spec via AI (or answer a question about it)
 */
export async function editVisualizationAction(
  editPrompt: string,
  existingOption: EChartsOption,
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

    const dataValidation = validateDataSize(existingOption, VALIDATION_LIMITS.MAX_EDIT_DATA_SIZE);
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

    const contextHistory = messages ? messages.map(m => ({ role: m.role, content: m.content })) : [];

    const result = await editChartSpec(existingOption, editPrompt, contextHistory);

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

    let updatedVisualization: SavedVisualization | null = null;

    // If the option was modified and we have an ID, update the database
    if (result.option && visualizationId) {
       const visualization = await VisualizationModel.findOne({ _id: visualizationId, userId });

       if (visualization) {
         visualization.spec = { ...visualization.spec, option: result.option };
         visualization.updatedAt = new Date();

         // Keep an active, non-saved, non-live session alive while in use
         if (visualization.isSaved === false && !visualization.liveData?.url) {
           visualization.sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
         }

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
      option: result.option, // Updated option payload (or undefined if just a question)
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
  spec: VisualizationSpec,
  metadata: VisualizationMetadata,
  isPublic: boolean = false,
  id?: string,
  history?: { role: 'user' | 'assistant'; content: string; timestamp: Date | string }[]
): Promise<{ success: boolean; id?: string; error?: string; data?: SavedVisualization | null }> {
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
    const dataValidation = validateDataSize(spec);
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

       if (!visualization) {
         // ID provided but not found, could imply user is trying to hack or it was deleted.
         // Fallback to creating new? No, safer to error if ID was explicit.
         return { success: false, error: 'Visualization not found or unauthorized' };
       }

       // First explicit save of an auto-persisted session — enforce the saved-visualizations limit
       if (visualization.isSaved === false) {
         const user = await UserModel.findOrCreate(userId);
         const maxAllowed = tier === 'free'
           ? VALIDATION_LIMITS.MAX_SAVED_VISUALIZATIONS_FREE
           : VALIDATION_LIMITS.MAX_SAVED_VISUALIZATIONS_PRO;

         if (user.savedVisualizations.length >= maxAllowed) {
           return {
             success: false,
             error: `Maximum saved visualizations limit reached (${maxAllowed}). Please delete some or upgrade your plan.`
           };
         }

         visualization.isSaved = true;
         visualization.sessionExpiresAt = undefined;

         const visualizationIdStr = visualization._id.toString();
         if (!user.savedVisualizations.some(vId => vId.toString() === visualizationIdStr)) {
           user.savedVisualizations.push(visualization._id as unknown as Types.ObjectId);
           await user.save();
         }
       }

       visualization.title = title; // Update title if changed
       visualization.spec = spec;
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
      // Check for existing visualization with same title (Legacy behavior)
      // Only do this if we didn't search by ID.
      const existingVisualization = await VisualizationModel.findOne({
        userId,
        title,
      });

      if (existingVisualization) {
        // Update existing visualization with new spec
        existingVisualization.spec = spec;
        existingVisualization.metadata = metadata;
        existingVisualization.isPublic = isPublic;
        if (history) {
           existingVisualization.history = history.map(h => ({
             ...h,
             timestamp: typeof h.timestamp === 'string' ? new Date(h.timestamp) : h.timestamp
           }));
        }
        existingVisualization.updatedAt = new Date();

        if (existingVisualization.isSaved === false) {
          existingVisualization.isSaved = true;
          existingVisualization.sessionExpiresAt = undefined;

          const user = await UserModel.findOrCreate(userId);
          const visualizationIdStr = existingVisualization._id.toString();
          if (!user.savedVisualizations.some(vId => vId.toString() === visualizationIdStr)) {
            user.savedVisualizations.push(existingVisualization._id as unknown as Types.ObjectId);
            await user.save();
          }
        }

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
          spec,
          metadata,
          isPublic,
          isSaved: true,
          history: history ? history.map(h => ({
             ...h,
             timestamp: typeof h.timestamp === 'string' ? new Date(h.timestamp) : h.timestamp
           })) : [],
        });

        // Update user's saved visualizations for new visualization only
        const visualizationIdStr = visualization._id.toString();
        const exists = user.savedVisualizations.some(id => id.toString() === visualizationIdStr);

        if (!exists) {
          user.savedVisualizations.push(visualization._id as unknown as Types.ObjectId);
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
export async function getUserVisualizations(limit?: number) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Authentication required', data: [] };
    }

    await connectToDatabase();

    const query = VisualizationModel.find({ userId, isSaved: { $ne: false } })
      .select('_id userId title spec metadata isPublic createdAt updatedAt history liveData')
      .sort({ updatedAt: -1 });

    const visualizations = await (limit ? query.limit(limit) : query).lean();

    return {
      success: true,
      data: visualizations.map(v => sanitizeVisualization(v)).filter((v): v is SavedVisualization => v !== null),
    };
  } catch (error) {
    console.error('Error fetching visualizations:', error);
    return { success: false, error: sanitizeError(error, 'Failed to fetch visualizations'), data: [] as SavedVisualization[] };
  }
}

/**
 * Get all of the current user's visualization "sessions" — saved
 * visualizations, live-data-connected visualizations, and not-yet-expired
 * ephemeral sessions — for hydrating the sidebar on load.
 */
export async function getUserSessions(limit: number = 50) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Authentication required', data: [] };
    }

    await connectToDatabase();

    const visualizations = await VisualizationModel.find({ userId })
      .select('_id title spec metadata isPublic shareId createdAt updatedAt history liveData isSaved')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    return {
      success: true,
      data: visualizations.map(v => sanitizeVisualization(v)).filter((v): v is SavedVisualization => v !== null),
    };
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return { success: false, error: sanitizeError(error, 'Failed to fetch sessions'), data: [] as SavedVisualization[] };
  }
}

/**
 * Persist a sidebar/title rename for an existing visualization.
 */
export async function updateVisualizationTitle(
  visualizationId: string,
  title: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Authentication required' };

    const idValidation = validateObjectId(visualizationId);
    if (!idValidation.valid) return { success: false, error: idValidation.error };

    const titleValidation = validateTitle(title);
    if (!titleValidation.valid) return { success: false, error: titleValidation.error };

    await connectToDatabase();

    const result = await VisualizationModel.updateOne(
      { _id: visualizationId, userId },
      { $set: { title: titleValidation.sanitized, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: 'Visualization not found or unauthorized' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating visualization title:', error);
    return { success: false, error: sanitizeError(error, 'Failed to update title') };
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
 * Save or clear a live data config on a saved visualization.
 * Pass null for liveData to disconnect the live source.
 */
export async function saveLiveDataConfig(
  visualizationId: string,
  liveData: { url: string; interval: number; lastRefreshed?: string } | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Authentication required' };

    const idValidation = validateObjectId(visualizationId);
    if (!idValidation.valid) return { success: false, error: idValidation.error };

    if (liveData) {
      let parsed: URL;
      try { parsed = new URL(liveData.url); } catch {
        return { success: false, error: 'Invalid URL' };
      }
      if (parsed.protocol !== 'https:') {
        return { success: false, error: 'Only HTTPS URLs are allowed' };
      }
    }

    await connectToDatabase();

    const doc = await VisualizationModel.findOne({ _id: visualizationId, userId }).select('isSaved');
    if (!doc) {
      return { success: false, error: 'Visualization not found or unauthorized' };
    }

    let update: Record<string, unknown>;
    if (liveData) {
      // Connecting to a live source: never expires.
      update = { $set: { liveData }, $unset: { sessionExpiresAt: '' } };
    } else {
      update = { $unset: { liveData: '' } };
      if (doc.isSaved === false) {
        // Disconnecting from an unsaved session: resume normal session TTL.
        update.$set = { sessionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) };
      }
    }

    await VisualizationModel.updateOne({ _id: visualizationId, userId }, update);

    return { success: true };
  } catch (error) {
    console.error('Error saving live data config:', error);
    return { success: false, error: sanitizeError(error, 'Failed to save live data config') };
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
