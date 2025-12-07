'use server';

import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/database/mongodb';
import { VisualizationModel, UserUsageModel } from '@/lib/database/models';
import { selectVisualizationFormat } from '@/lib/services/format-selector';
import { expandNetworkNode, generateVisualizationData } from '@/lib/services/visualization-generator';
import { checkRateLimit, cacheGet, cacheSet } from '@/lib/database/redis';
import { generateCacheKey, calculateCost } from '@/lib/utils/helpers';
import { FORMAT_INFO } from '@/lib/types/visualization';
import type {
  VisualizationType,
  VisualizationResponse,
  VisualizationData,
  VisualizationMetadata,
} from '@/lib/types/visualization';

const RATE_LIMITS = {
  free: parseInt(process.env.RATE_LIMIT_FREE_TIER || '5'),
  pro: parseInt(process.env.RATE_LIMIT_PRO_TIER || '100'),
};

/**
 * Generate a new visualization from user input
 */
export async function generateVisualization(
  input: string,
  preferredFormat?: VisualizationType
): Promise<VisualizationResponse> {
  const startTime = Date.now();

  try {
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

    // Get user usage and check rate limits
    let userUsage = await UserUsageModel.findOne({ userId });
    if (!userUsage) {
      userUsage = await UserUsageModel.create({
        userId,
        visualizationsCreated: 0,
        lastResetDate: new Date(),
        tier: 'free',
      });
    }

    const rateLimit = await checkRateLimit(
      userId,
      userUsage.tier === 'pro' ? RATE_LIMITS.pro : RATE_LIMITS.free
    );

    if (!rateLimit.allowed) {
      const resetDate = new Date(rateLimit.resetAt);
      return {
        success: false,
        type: 'network_graph',
        data: {} as VisualizationData,
        reason: '',
        error: `Rate limit exceeded. Resets at ${resetDate.toLocaleTimeString()}`,
      };
    }

    // Check cache
    const cacheKey = generateCacheKey(input, preferredFormat);
    const cached = await cacheGet<VisualizationResponse>(cacheKey);
    if (cached) {
      console.log('✅ Cache hit for visualization');
      return { ...cached, success: true };
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

    // Cache the result (1 hour TTL)
    await cacheSet(cacheKey, response, 3600);

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
  nodeLabel: string,
  originalInput: string,
  existingNodeIds: string[]
) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Authentication required' };

    // Call the AI service to get new nodes
    // Note: Ensure expandNetworkNode is exported from your service
    const newData = await expandNetworkNode(nodeLabel, originalInput, existingNodeIds);
    
    return { success: true, data: newData };
  } catch (error) {
    console.error('Error expanding node:', error);
    return { success: false, error: 'Failed to expand node' };
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

    await connectToDatabase();

    const visualization = await VisualizationModel.create({
      userId,
      title,
      type,
      data,
      metadata,
      isPublic,
    });

    return { success: true, id: visualization._id.toString() };
  } catch (error) {
    console.error('Error saving visualization:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save visualization',
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

    const visualizations = await VisualizationModel.find({ userId })
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
    return { success: false, error: 'Failed to fetch visualizations', data: [] };
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
 */
export async function getUserUsage() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Authentication required', data: null };
    }

    await connectToDatabase();

    let userUsage = await UserUsageModel.findOne({ userId }).lean();

    if (!userUsage) {
      userUsage = await UserUsageModel.create({
        userId,
        visualizationsCreated: 0,
        lastResetDate: new Date(),
        tier: 'free',
      });
    }

    const rateLimit = await checkRateLimit(
      userId,
      userUsage.tier === 'pro' ? RATE_LIMITS.pro : RATE_LIMITS.free
    );

    return {
      success: true,
      data: {
        ...userUsage,
        remaining: rateLimit.remaining,
        resetAt: new Date(rateLimit.resetAt),
      },
    };
  } catch (error) {
    console.error('Error fetching user usage:', error);
    return { success: false, error: 'Failed to fetch usage data', data: null };
  }
}
