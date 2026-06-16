'use server';

import { connectToDatabase } from '@/lib/database/mongodb';
import { UserUsageModel } from '@/lib/database/models';
import { TOKEN_LIMITS } from '@/lib/utils/validation';
import type { HydratedDocument } from 'mongoose';
import type { UserUsage } from '@/lib/types/visualization';

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

function getNextResetDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

async function refreshTokensIfNeeded(usage: HydratedDocument<UserUsage>): Promise<void> {
  const now = new Date();
  if (now >= new Date(usage.tokenResetDate)) {
    const newLimit = getTokenLimitForTier(usage.tier);
    usage.tokensUsed = 0;
    usage.tokensLimit = newLimit;
    usage.tokenResetDate = getNextResetDate();
    await usage.save();
  }
}

async function getUserUsage(userId: string): Promise<HydratedDocument<UserUsage>> {
  await connectToDatabase();

  let usage = await UserUsageModel.findOne({ userId });

  if (!usage) {
    const tier = 'free';
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
    // Ensure tokensLimit matches tier in case tier was updated externally
    const expectedLimit = getTokenLimitForTier(usage.tier);
    if (usage.tokensLimit !== expectedLimit) {
      usage.tokensLimit = expectedLimit;
      await usage.save();
    }

    await refreshTokensIfNeeded(usage);
  }

  return usage;
}

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
      error: `Insufficient tokens. You need ${tokenCost} tokens but only have ${tokensRemaining} remaining. Resets on ${new Date(usage.tokenResetDate).toLocaleDateString()}.`,
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

export async function deductTokens(
  userId: string,
  tokenCost: number
): Promise<{
  success: boolean;
  tokensUsed: number;
  tokensRemaining: number;
  error?: string;
}> {
  // getUserUsage handles refresh and ensures record exists
  const usage = await getUserUsage(userId);

  // Atomic conditional increment: only succeeds if tokensUsed + tokenCost <= tokensLimit
  const result = await UserUsageModel.findOneAndUpdate(
    {
      userId,
      $expr: { $lte: [{ $add: ['$tokensUsed', tokenCost] }, '$tokensLimit'] },
    },
    { $inc: { tokensUsed: tokenCost } },
    { returnDocument: 'after' }
  );

  if (!result) {
    const remaining = usage.tokensLimit - usage.tokensUsed;
    return {
      success: false,
      tokensUsed: usage.tokensUsed,
      tokensRemaining: remaining,
      error: `Insufficient tokens. You need ${tokenCost} tokens but only have ${remaining} remaining.`,
    };
  }

  return {
    success: true,
    tokensUsed: result.tokensUsed,
    tokensRemaining: result.tokensLimit - result.tokensUsed,
  };
}

/**
 * Refund tokens back to a user (e.g. when the actual AI cost was less than
 * the pre-deducted estimate). Clamps at 0 so tokensUsed never goes negative.
 */
export async function refundTokens(userId: string, amount: number): Promise<void> {
  if (amount <= 0) return;
  // Pipeline update required for $max/$subtract expressions. Mongoose 9 needs
  // updatePipeline: true explicitly (it throws on pipeline syntax by default).
  await UserUsageModel.findOneAndUpdate(
    { userId },
    [{ $set: { tokensUsed: { $max: [0, { $subtract: ['$tokensUsed', amount] }] } } }],
    { updatePipeline: true }
  );
}

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
  const percentageUsed = Math.round((usage.tokensUsed / usage.tokensLimit) * 1000) / 10;

  return {
    tokensUsed: usage.tokensUsed,
    tokensLimit: usage.tokensLimit,
    tokensRemaining,
    resetDate: usage.tokenResetDate,
    tier: usage.tier,
    percentageUsed,
  };
}

export async function updateUserTier(
  userId: string,
  newTier: 'free' | 'pro' | 'enterprise'
): Promise<{ success: boolean; error?: string }> {
  try {
    const usage = await getUserUsage(userId);

    usage.tier = newTier;
    usage.tokensLimit = getTokenLimitForTier(newTier);
    await usage.save();

    return { success: true };
  } catch (error) {
    console.error('Error updating user tier:', error);
    return { success: false, error: 'Failed to update user tier' };
  }
}
