import { getRedis } from '@/lib/utils/redis';
import { generateCacheKey } from '@/lib/utils/helpers';
import type { EChartsOption } from 'echarts';

const TTL_SECONDS = 24 * 60 * 60; // 24 hours

export interface CachedChartSpec {
  title: string;
  option: EChartsOption;
  reason: string;
}

/**
 * Returns a cached chart spec (structure only — theme is applied at render
 * time so the same cached structure can be restyled per-user), or null on
 * miss / Redis unavailable.
 * Cache is shared globally across users — the same input always produces
 * an equivalent AI composition, so sharing is safe and maximises hit rate.
 */
export async function getCachedVisualization(input: string): Promise<CachedChartSpec | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const key = generateCacheKey(input.trim().toLowerCase());
    return await redis.get<CachedChartSpec>(key);
  } catch {
    return null;
  }
}

/**
 * Stores a generated chart spec in cache.
 * Fire-and-forget — callers should NOT await this if they don't want it
 * on the critical path.
 */
export async function setCachedVisualization(input: string, spec: CachedChartSpec): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    const key = generateCacheKey(input.trim().toLowerCase());
    await redis.set(key, spec, { ex: TTL_SECONDS });
  } catch {
    // Cache write failures are non-fatal
  }
}
