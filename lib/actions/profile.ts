"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database/mongodb";
import { UserModel, VisualizationModel, UserUsageModel } from "@/lib/database/models";
import { checkDeleteRateLimit } from "@/lib/database/redis";
import { validateObjectId, sanitizeError } from "@/lib/utils/validation";
import type { SavedVisualization } from "@/lib/types/visualization";

export interface UserProfile {
  clerkId: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  plan: 'free' | 'pro' | 'enterprise';
  usageCount: number;
  totalSavedVisualizations: number;
  extendedNodesCount: number;
  createdAt: string;
}

/**
 * Get current user's profile
 */
export async function getUserProfile(): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    await connectToDatabase();
    const user = await UserModel.findOrCreate(userId);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const profile: UserProfile = {
      clerkId: user.clerkId,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      plan: user.plan || 'free',
      usageCount: user.usageCount || 0,
      totalSavedVisualizations: user.savedVisualizations.length,
      extendedNodesCount: user.extendedNodes.length,
      createdAt: user.createdAt.toISOString(),
    };

    return { success: true, data: profile };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { success: false, error: sanitizeError(error, 'Failed to fetch user profile') };
  }
}

/**
 * Get user's saved visualizations
 */
export async function getUserVisualizations(): Promise<{ success: boolean; data?: SavedVisualization[]; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    await connectToDatabase();

    // SECURITY: Use field projection to only return necessary fields
    const visualizations = await VisualizationModel
      .find({ userId })
      .select('_id userId title type data metadata isPublic createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .exec();

    // Convert MongoDB documents to plain objects
    const data = visualizations.map(viz => ({
      ...viz,
      _id: viz._id.toString(),
      createdAt: viz.createdAt.toISOString(),
      updatedAt: viz.updatedAt.toISOString(),
      metadata: {
        ...viz.metadata,
        generatedAt: viz.metadata.generatedAt.toISOString(),
      },
    })) as unknown as SavedVisualization[];

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching user visualizations:', error);
    return { success: false, error: sanitizeError(error, 'Failed to fetch visualizations') };
  }
}

/**
 * Delete a saved visualization
 */
export async function deleteVisualization(visualizationId: string): Promise<{ success: boolean; error?: string }> {
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

    // SECURITY: Get user tier for rate limiting
    const userUsage = await UserUsageModel.findOne({ userId });
    const tier = userUsage?.tier || 'free';

    // SECURITY: Check delete rate limit
    const rateLimit = await checkDeleteRateLimit(userId, tier);
    if (!rateLimit.allowed) {
      const resetDate = new Date(rateLimit.resetAt);
      return {
        success: false,
        error: `Delete limit exceeded. Resets at ${resetDate.toLocaleTimeString()}`
      };
    }

    // Delete the visualization
    const result = await VisualizationModel.findOneAndDelete({
      _id: visualizationId,
      userId, // Ensure user owns this visualization
    });

    if (!result) {
      return { success: false, error: 'Visualization not found or unauthorized' };
    }

    // Remove from user's saved visualizations
    await UserModel.findOneAndUpdate(
      { clerkId: userId },
      { $pull: { savedVisualizations: visualizationId } }
    );

    return { success: true };
  } catch (error) {
    console.error('Error deleting visualization:', error);
    return { success: false, error: sanitizeError(error, 'Failed to delete visualization') };
  }
}

/**
 * Update user plan
 * SECURITY: This function has been disabled for security.
 * Plan upgrades should only be performed via payment webhooks or admin dashboard.
 *
 * @deprecated Use payment provider webhooks to handle plan upgrades
 */
export async function updateUserPlan(plan: 'free' | 'pro' | 'enterprise'): Promise<{ success: boolean; error?: string }> {
  // SECURITY FIX: Prevent unauthorized plan upgrades
  // Users should not be able to upgrade their own plans
  // This should only be done via Stripe webhooks or admin panel
  return {
    success: false,
    error: 'Plan upgrades must be processed through the payment system'
  };
}

/**
 * Get a specific visualization by ID
 */
export async function getVisualizationById(visualizationId: string): Promise<{ success: boolean; data?: SavedVisualization; error?: string }> {
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

    // SECURITY: Use field projection to only return necessary fields
    const visualization = await VisualizationModel
      .findOne({ _id: visualizationId, userId })
      .select('_id userId title type data metadata isPublic createdAt updatedAt')
      .lean()
      .exec();

    if (!visualization) {
      return { success: false, error: 'Visualization not found' };
    }

    // Convert MongoDB document to plain object
    const data = {
      ...visualization,
      _id: visualization._id.toString(),
      createdAt: visualization.createdAt.toISOString(),
      updatedAt: visualization.updatedAt.toISOString(),
      metadata: {
        ...visualization.metadata,
        generatedAt: visualization.metadata.generatedAt.toISOString(),
      },
    } as unknown as SavedVisualization;

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching visualization:', error);
    return { success: false, error: sanitizeError(error, 'Failed to fetch visualization') };
  }
}
