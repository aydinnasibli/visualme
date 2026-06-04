import { getRedis } from '@/lib/utils/redis';
import { generateCacheKey } from '@/lib/utils/helpers';
import type { VisualizationData, VisualizationType } from '@/lib/types/visualization';

const TTL_SECONDS = 24 * 60 * 60; // 24 hours

/**
 * Returns cached visualization data, or null on miss / Redis unavailable.
 * Cache is shared globally across users — the same input+format always produces
 * equivalent AI output, so sharing is safe and maximises hit rate.
 */
export async function getCachedVisualization(
  input: string,
  format: VisualizationType
): Promise<VisualizationData | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const key = generateCacheKey(input.trim().toLowerCase(), format);
    return await redis.get<VisualizationData>(key);
  } catch {
    return null;
  }
}

/**
 * Stores a visualization result in cache.
 * Fire-and-forget — callers should NOT await this if they don't want it
 * on the critical path.
 */
export async function setCachedVisualization(
  input: string,
  format: VisualizationType,
  data: VisualizationData
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    const key = generateCacheKey(input.trim().toLowerCase(), format);
    await redis.set(key, data, { ex: TTL_SECONDS });
  } catch {
    // Cache write failures are non-fatal
  }
}
