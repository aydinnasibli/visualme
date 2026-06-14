"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database/mongodb";
import { UserModel } from "@/lib/database/models";
import { sanitizeError } from "@/lib/utils/validation";
import type { BrandTheme, BrandKit } from "@/lib/types/echarts-spec";

/**
 * Shape-checks a client-supplied `BrandTheme` before it's persisted —
 * `ThemePanel` only ever produces well-formed themes, but this is the
 * boundary where an authenticated user's input enters the database.
 */
function isValidBrandTheme(theme: unknown): theme is BrandTheme {
  if (!theme || typeof theme !== 'object') return false;
  const t = theme as Record<string, unknown>;

  if (t.mode !== 'light' && t.mode !== 'dark') return false;
  if (!Array.isArray(t.palette) || t.palette.length === 0 || !t.palette.every(c => typeof c === 'string')) return false;
  if (typeof t.fontFamily !== 'string') return false;

  if (!t.fontSize || typeof t.fontSize !== 'object') return false;
  const fontSize = t.fontSize as Record<string, unknown>;
  for (const key of ['title', 'subtitle', 'axisLabel', 'legend', 'tooltip']) {
    if (typeof fontSize[key] !== 'number') return false;
  }

  if (!['compact', 'comfortable', 'spacious'].includes(t.spacing as string)) return false;
  if (!['top', 'bottom', 'left', 'right', 'none'].includes(t.legendPosition as string)) return false;

  return true;
}

/**
 * Get the current user's personal brand kit, or `null` if they haven't saved one.
 */
export async function getBrandKit(): Promise<{ success: boolean; data?: BrandKit | null; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Authentication required' };

    await connectToDatabase();
    const user = await UserModel.findOne({ clerkId: userId }).select('brandKit').lean();
    if (!user?.brandKit?.theme) return { success: true, data: null };

    return {
      success: true,
      data: {
        theme: user.brandKit.theme,
        updatedAt: user.brandKit.updatedAt?.toISOString?.(),
      },
    };
  } catch (error) {
    console.error('Error fetching brand kit:', error);
    return { success: false, error: sanitizeError(error, 'Failed to fetch brand kit') };
  }
}

/**
 * Save (or overwrite) the current theme as the user's personal brand kit.
 * Applied automatically as the default theme for every newly generated chart.
 */
export async function saveBrandKit(theme: BrandTheme): Promise<{ success: boolean; data?: BrandKit; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Authentication required' };

    if (!isValidBrandTheme(theme)) return { success: false, error: 'Invalid theme' };

    await connectToDatabase();
    const updatedAt = new Date();
    await UserModel.updateOne(
      { clerkId: userId },
      { $set: { brandKit: { theme, updatedAt } } }
    );

    return { success: true, data: { theme, updatedAt: updatedAt.toISOString() } };
  } catch (error) {
    console.error('Error saving brand kit:', error);
    return { success: false, error: sanitizeError(error, 'Failed to save brand kit') };
  }
}

/**
 * Remove the user's personal brand kit — newly generated charts fall back to
 * the built-in default theme.
 */
export async function deleteBrandKit(): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Authentication required' };

    await connectToDatabase();
    await UserModel.updateOne({ clerkId: userId }, { $unset: { brandKit: 1 } });

    return { success: true };
  } catch (error) {
    console.error('Error deleting brand kit:', error);
    return { success: false, error: sanitizeError(error, 'Failed to delete brand kit') };
  }
}

/**
 * Internal helper for chart generation (`lib/actions/visualize.ts`) — returns
 * the caller's personal brand kit theme, or `null` if none is saved. The
 * caller must already be authenticated; this skips the `auth()` round trip
 * since `generateVisualization` has already performed it.
 */
export async function getDefaultBrandTheme(userId: string): Promise<BrandTheme | null> {
  await connectToDatabase();
  const user = await UserModel.findOne({ clerkId: userId }).select('brandKit').lean();
  return user?.brandKit?.theme ?? null;
}
