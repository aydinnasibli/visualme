"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database/mongodb";
import { UserModel } from "@/lib/database/models";
import { sanitizeError, getTokenCosts } from "@/lib/utils/validation";
import { getTokenBalance } from "@/lib/utils/tokens";

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

    // Fetch full user data from Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { success: false, error: 'User not found in Clerk' };
    }

    await connectToDatabase();

    // Sync Clerk user data with MongoDB
    const userData = {
      email: clerkUser.emailAddresses[0]?.emailAddress,
      username: clerkUser.username || undefined,
      firstName: clerkUser.firstName || undefined,
      lastName: clerkUser.lastName || undefined,
      imageUrl: clerkUser.imageUrl || undefined,
    };

    const user = await UserModel.findOrCreate(userId, userData);

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
 * Get user's token limits and current usage
 */
export async function getUserLimits(): Promise<{
  success: boolean;
  data?: {
    tokens: {
      used: number;
      limit: number;
      remaining: number;
      resetDate: string;
      percentageUsed: number;
    };
    tier: 'free' | 'pro' | 'enterprise';
    costs: {
      generateVisualization: number;
      editVisualization: number;
      expandNode: number;
      exportVisualization: number;
      saveVisualization: number;
      deleteVisualization: number;
    };
    estimatedOperations: {
      visualizations: number;
      edits: number;
      expansions: number;
      exports: number;
    };
  };
  error?: string;
}> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // Get token balance
    const balance = await getTokenBalance(userId);
    const costs = getTokenCosts();

    // Calculate how many operations they can still do
    const estimatedOperations = {
      visualizations: Math.floor(balance.tokensRemaining / costs.generateVisualization),
      edits: Math.floor(balance.tokensRemaining / costs.editVisualization),
      expansions: Math.floor(balance.tokensRemaining / costs.expandNode),
      exports: Math.floor(balance.tokensRemaining / costs.exportVisualization),
    };

    return {
      success: true,
      data: {
        tokens: {
          used: balance.tokensUsed,
          limit: balance.tokensLimit,
          remaining: balance.tokensRemaining,
          resetDate: balance.resetDate.toISOString(),
          percentageUsed: balance.percentageUsed,
        },
        tier: balance.tier,
        costs,
        estimatedOperations,
      },
    };
  } catch (error) {
    console.error('Error fetching user limits:', error);
    return { success: false, error: sanitizeError(error, 'Failed to fetch user limits') };
  }
}
