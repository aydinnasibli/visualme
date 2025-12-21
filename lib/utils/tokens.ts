'use server';

import { connectToDatabase } from '@/lib/database/mongodb';
import { UserUsageModel } from '@/lib/database/models';
import { TOKEN_LIMITS } from '@/lib/utils/validation';
import type { UserUsage } from '@/lib/types/visualization';

/**
 * Get tier-specific token limit
 */
function getTokenLimitForTier(tier: 'free' | 'pro' | 'enterprise'): number {
  switch (tier) {
    case 'free':
      return TOKEN_LIMITS.FREE_TIER_MONTHLY_TOKENS;
    case 'pro':
      return TOKEN_LIMITS.PRO_TIER_MONTHLY_TOKENS;
    case 'enterprise':
      return TOKEN_LIMITS.ENTERPRISE_TIER_MONTHLY_TOKENS;
    default:
      return TOKEN_LIMITS.FREE_TIER_MONTHLY_TOKENS;
  }
}

/**
 * Calculate next reset date (1st of next month)
 */
function getNextResetDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

/**
 * Check if tokens need to be refreshed and refresh if needed
 */
async function refreshTokensIfNeeded(usage: any): Promise<boolean> {
  const now = new Date();
  const resetDate = new Date(usage.tokenResetDate);

  if (now >= resetDate) {
    // Reset tokens
    const newLimit = getTokenLimitForTier(usage.tier);
    usage.tokensUsed = 0;
    usage.tokensLimit = newLimit;
    usage.tokenResetDate = getNextResetDate();
    await usage.save();
    return true; // Tokens were refreshed
  }

  return false; // No refresh needed
}

/**
 * Get or create user usage record with token tracking
 */
export async function getUserUsage(userId: string): Promise<any> {
  await connectToDatabase();

  let usage = await UserUsageModel.findOne({ userId });

  if (!usage) {
    // Create new usage record
    const tier = 'free'; // Default tier
    usage = await UserUsageModel.create({
      userId,
      tier,
      tokensUsed: 0,
      tokensLimit: getTokenLimitForTier(tier),
      tokenResetDate: getNextResetDate(),
      visualizationsCreated: 0,
      lastResetDate: new Date(),
    });
  } else {
    // CRITICAL FIX: Ensure tokensLimit matches tier
    const expectedLimit = getTokenLimitForTier(usage.tier);
    if (usage.tokensLimit !== expectedLimit) {
      console.log(`⚠️  Token limit mismatch for user ${userId}. Tier: ${usage.tier}, Limit: ${usage.tokensLimit}, Expected: ${expectedLimit}. Fixing...`);
      usage.tokensLimit = expectedLimit;
      await usage.save();
      console.log(`✅ Fixed token limit for user ${userId} to ${expectedLimit}`);
    }

    // Check if we need to refresh tokens
    await refreshTokensIfNeeded(usage);
  }

  return usage;
}

/**
 * Check if user has enough tokens for an operation
 */
export async function checkTokenBalance(
  userId: string,
  tokenCost: number
): Promise<{
  allowed: boolean;
  tokensUsed: number;
  tokensLimit: number;
  tokensRemaining: number;
  resetDate: Date;
  error?: string;
}> {
  const usage = await getUserUsage(userId);

  const tokensRemaining = usage.tokensLimit - usage.tokensUsed;

  if (tokensRemaining < tokenCost) {
    return {
      allowed: false,
      tokensUsed: usage.tokensUsed,
      tokensLimit: usage.tokensLimit,
      tokensRemaining,
      resetDate: usage.tokenResetDate,
      error: `Insufficient tokens. You need ${tokenCost} tokens but only have ${tokensRemaining} remaining. Resets on ${usage.tokenResetDate.toLocaleDateString()}.`,
    };
  }

  return {
    allowed: true,
    tokensUsed: usage.tokensUsed,
    tokensLimit: usage.tokensLimit,
    tokensRemaining,
    resetDate: usage.tokenResetDate,
  };
}

/**
 * Deduct tokens from user's balance
 */
export async function deductTokens(
  userId: string,
  tokenCost: number
): Promise<{
  success: boolean;
  tokensUsed: number;
  tokensRemaining: number;
  error?: string;
}> {
  const usage = await getUserUsage(userId);

  const tokensRemaining = usage.tokensLimit - usage.tokensUsed;

  if (tokensRemaining < tokenCost) {
    return {
      success: false,
      tokensUsed: usage.tokensUsed,
      tokensRemaining,
      error: `Insufficient tokens. You need ${tokenCost} tokens but only have ${tokensRemaining} remaining.`,
    };
  }

  // Deduct tokens
  usage.tokensUsed += tokenCost;
  await usage.save();

  return {
    success: true,
    tokensUsed: usage.tokensUsed,
    tokensRemaining: usage.tokensLimit - usage.tokensUsed,
  };
}

/**
 * Get user's token balance and limits
 */
export async function getTokenBalance(userId: string): Promise<{
  tokensUsed: number;
  tokensLimit: number;
  tokensRemaining: number;
  resetDate: Date;
  tier: 'free' | 'pro' | 'enterprise';
  percentageUsed: number;
}> {
  const usage = await getUserUsage(userId);

  const tokensRemaining = usage.tokensLimit - usage.tokensUsed;
  const percentageUsed = (usage.tokensUsed / usage.tokensLimit) * 100;

  return {
    tokensUsed: usage.tokensUsed,
    tokensLimit: usage.tokensLimit,
    tokensRemaining,
    resetDate: usage.tokenResetDate,
    tier: usage.tier,
    percentageUsed: Math.round(percentageUsed * 10) / 10, // Round to 1 decimal
  };
}


/**
 * Update user's tier and token limit
 */
export async function updateUserTier(
  userId: string,
  newTier: 'free' | 'pro' | 'enterprise'
): Promise<{ success: boolean; error?: string }> {
  try {
    const usage = await getUserUsage(userId);

    // Update tier and limit
    usage.tier = newTier;
    usage.tokensLimit = getTokenLimitForTier(newTier);

    // Don't reset tokensUsed - let them keep their usage for the current period
    // This way if they upgrade mid-month, they get the new limit immediately

    await usage.save();

    return { success: true };
  } catch (error) {
    console.error('Error updating user tier:', error);
    return { success: false, error: 'Failed to update user tier' };
  }
}
