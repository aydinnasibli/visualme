import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn('⚠️  Redis credentials not found. Caching will be disabled.');
}

export const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

/**
 * Cache a visualization result
 * @param key - Cache key (usually hashed input)
 * @param value - Value to cache
 * @param ttl - Time to live in seconds (default: 1 hour)
 */
export async function cacheSet(key: string, value: any, ttl: number = 3600): Promise<void> {
  if (!redis) return;

  try {
    await redis.set(key, JSON.stringify(value), { ex: ttl });
  } catch (error) {
    console.error('Redis cache set error:', error);
  }
}

/**
 * Get a cached visualization result
 * @param key - Cache key
 * @returns Cached value or null
 */
export async function cacheGet<T = any>(key: string): Promise<T | null> {
  if (!redis) return null;

  try {
    const value = await redis.get(key);
    return value ? (typeof value === 'string' ? JSON.parse(value) : value) : null;
  } catch (error) {
    console.error('Redis cache get error:', error);
    return null;
  }
}

/**
 * Delete a cached value
 * @param key - Cache key
 */
export async function cacheDelete(key: string): Promise<void> {
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.error('Redis cache delete error:', error);
  }
}

/**
 * Check rate limit for a user
 * @param userId - User ID
 * @param limit - Maximum requests per window
 * @param window - Time window in seconds
 * @returns true if within limit, false if exceeded
 */
export async function checkRateLimit(
  userId: string,
  limit: number,
  window: number = 3600
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (!redis) {
    return { allowed: true, remaining: limit, resetAt: Date.now() + window * 1000 };
  }

  try {
    const key = `ratelimit:${userId}`;
    const now = Date.now();
    const resetAt = now + window * 1000;

    // Get current count
    const count = await redis.get<number>(key);

    if (!count) {
      // First request
      await redis.set(key, 1, { ex: window });
      return { allowed: true, remaining: limit - 1, resetAt };
    }

    if (count >= limit) {
      // Rate limit exceeded
      const ttl = await redis.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + (ttl > 0 ? ttl * 1000 : 0),
      };
    }

    // Increment count
    await redis.incr(key);
    return { allowed: true, remaining: limit - count - 1, resetAt };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request
    return { allowed: true, remaining: limit, resetAt: Date.now() + window * 1000 };
  }
}

export default redis;
