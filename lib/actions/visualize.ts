'use server';

import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/database/mongodb';
import { VisualizationModel, UserUsageModel, UserModel } from '@/lib/database/models';
import { selectVisualizationFormat } from '@/lib/services/format-selector';
import { expandNetworkNode, expandMindMapNode, generateVisualizationData } from '@/lib/services/visualization-generator';
import { calculateCost } from '@/lib/utils/helpers';
import { FORMAT_INFO } from '@/lib/types/visualization';
import {
  validateInputLength,
  validateObjectId,
  validateDataSize,
  validateArraySize,
  validateTitle,
  sanitizeError,
  VALIDATION_LIMITS,
  TOKEN_COSTS
} from '@/lib/utils/validation';
import { checkTokenBalance, deductTokens, getTokenBalance } from '@/lib/utils/tokens';
import type {
  VisualizationType,
  VisualizationResponse,
  VisualizationData,
  VisualizationMetadata,
  MindMapNode,
} from '@/lib/types/visualization';

/**
 * Generate a new visualization from user input
 */
export async function generateVisualization(
  input: string,
  preferredFormat?: VisualizationType
): Promise<VisualizationResponse> {
  const startTime = Date.now();

  try {
    // SECURITY: Validate input length
    const inputValidation = validateInputLength(input);
    if (!inputValidation.valid) {
      return {
        success: false,
        type: 'network_graph',
        data: {} as VisualizationData,
        reason: '',
        error: inputValidation.error || 'Invalid input',
      };
    }

    // Get authenticated user
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        type: 'network_graph',
        data: {} as VisualizationData,
        reason: '',
        error: 'Authentication required',
      };
    }

    // Connect to database
    await connectToDatabase();

    // TOKEN SYSTEM: Check if user has enough tokens
    const tokenCheck = await checkTokenBalance(userId, TOKEN_COSTS.GENERATE_VISUALIZATION);

    if (!tokenCheck.allowed) {
      return {
        success: false,
        type: 'network_graph',
        data: {} as VisualizationData,
        reason: '',
        error: tokenCheck.error || 'Insufficient tokens',
      };
    }

    // Step 1: Analyze input and select format
    const formatSelection = await selectVisualizationFormat(input, preferredFormat);

    if (!formatSelection.visualizable || formatSelection.format === 'none') {
      return {
        success: false,
        type: 'network_graph',
        data: {} as VisualizationData,
        reason: formatSelection.reason,
        error: 'This content is not suitable for visualization',
      };
    }

    // Step 2: Generate visualization data
    const data = await generateVisualizationData(formatSelection.format, input);

    // Calculate metadata
    const processingTime = Date.now() - startTime;
    const formatInfo = FORMAT_INFO[formatSelection.format];
    const cost = calculateCost(input.length, formatInfo.estimatedCost);

    const metadata: VisualizationMetadata = {
      generatedAt: new Date(),
      processingTime,
      aiModel: 'gpt-4o-mini',
      cost,
      originalInput: input,
    };

    const response: VisualizationResponse = {
      success: true,
      type: formatSelection.format,
      data,
      reason: formatSelection.reason,
      metadata,
    };

    // TOKEN SYSTEM: Deduct tokens for successful generation
    await deductTokens(userId, TOKEN_COSTS.GENERATE_VISUALIZATION);

    // Update user usage
    await UserUsageModel.updateOne(
      { userId },
      { $inc: { visualizationsCreated: 1 } }
    );

    return response;
  } catch (error) {
    console.error('Error generating visualization:', error);
    return {
      success: false,
      type: 'network_graph',
      data: {} as VisualizationData,
      reason: '',
      error: error instanceof Error ? error.message : 'Failed to generate visualization',
    };
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
    const newData = await expandNetworkNode(nodeLabel, nodeId, originalInput, existingNodeLabels);

    // TOKEN SYSTEM: Deduct tokens for successful expansion
    await deductTokens(userId, TOKEN_COSTS.EXPAND_NODE);

    // Track expansion count
    await UserUsageModel.updateOne(
      { userId },
      { $inc: { visualizationsCreated: 1 } }
    );

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
    const newNodes = await expandMindMapNode(nodeContent, nodeId, originalInput, existingNodeIds);

    // TOKEN SYSTEM: Deduct tokens for successful expansion
    await deductTokens(userId, TOKEN_COSTS.EXPAND_NODE);

    // Track expansion count
    await UserUsageModel.updateOne(
      { userId },
      { $inc: { visualizationsCreated: 1 } }
    );

    return { success: true, data: newNodes };
  } catch (error) {
    console.error('Error expanding mind map node:', error);
    return { success: false, error: sanitizeError(error, 'Failed to expand mind map node') };
  }
}

/**
 * Regenerate visualization with different format
 */
export async function regenerateVisualization(
  input: string,
  newFormat: VisualizationType
): Promise<VisualizationResponse> {
  return generateVisualization(input, newFormat);
}

/**
 * Save a visualization to database
 */
export async function saveVisualization(
  title: string,
  type: VisualizationType,
  data: VisualizationData,
  metadata: VisualizationMetadata,
  isPublic: boolean = false
): Promise<{ success: boolean; id?: string; error?: string }> {
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

    // Check for existing visualization with same title and type
    const existingVisualization = await VisualizationModel.findOne({
      userId,
      title,
      type,
    });

    let visualization;

    if (existingVisualization) {
      // Update existing visualization with new data (e.g., after extending nodes)
      existingVisualization.data = data;
      existingVisualization.metadata = metadata;
      existingVisualization.isPublic = isPublic;
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
      });

      // Update user's saved visualizations for new visualization only
      const visualizationIdStr = visualization._id.toString();
      const exists = user.savedVisualizations.some(id => id.toString() === visualizationIdStr);

      if (!exists) {
        user.savedVisualizations.push(visualization._id as any);
        await user.save();
      }
    }

    return { success: true, id: visualization._id.toString() };
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
      .select('_id userId title type data metadata isPublic createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return {
      success: true,
      data: visualizations.map((v) => ({
        ...v,
        _id: v._id.toString(),
      })),
    };
  } catch (error) {
    console.error('Error fetching visualizations:', error);
    return { success: false, error: sanitizeError(error, 'Failed to fetch visualizations'), data: [] };
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

    await connectToDatabase();

    const result = await VisualizationModel.deleteOne({
      _id: visualizationId,
      userId, // Ensure user owns this visualization
    });

    if (result.deletedCount === 0) {
      return { success: false, error: 'Visualization not found or unauthorized' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting visualization:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete visualization',
    };
  }
}

/**
 * Get user usage statistics
 * @deprecated Use getUserLimits from profile.ts instead
 */
export async function getUserUsage() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Authentication required', data: null };
    }

    // Get token balance
    const balance = await getTokenBalance(userId);

    return {
      success: true,
      data: {
        userId,
        tier: balance.tier,
        tokensUsed: balance.tokensUsed,
        tokensLimit: balance.tokensLimit,
        tokensRemaining: balance.tokensRemaining,
        resetAt: balance.resetDate,
      },
    };
  } catch (error) {
    console.error('Error fetching user usage:', error);
    return { success: false, error: 'Failed to fetch usage data', data: null };
  }
}
