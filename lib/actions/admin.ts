'use server';

import { auth } from '@clerk/nextjs/server';
import { updateUserTier } from '@/lib/utils/tokens';

/**
 * TEMPORARY TESTING FUNCTION
 * Manually upgrade user tier for testing
 *
 * In production, this should be called by:
 * - Stripe webhook after payment
 * - Admin dashboard
 *
 * Remove this file before production!
 */
export async function upgradeTierForTesting(
  tier: 'free' | 'pro' | 'enterprise'
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    const result = await updateUserTier(userId, tier);

    if (result.success) {
      return {
        success: true,
        message: `Successfully upgraded to ${tier} tier! Refresh the page to see changes.`
      };
    }

    return { success: false, error: result.error };
  } catch (error) {
    console.error('Error upgrading tier:', error);
    return { success: false, error: 'Failed to upgrade tier' };
  }
}
