import { Ratelimit } from '@upstash/ratelimit';
import { getRedis } from '@/lib/utils/redis';

export type RateLimitOperation = 'generate' | 'edit' | 'expand';

/**
 * Sliding-window limits per operation type.
 * These protect against burst abuse while being generous enough for real usage.
 * Token balance (monthly cap) is a separate, orthogonal concern.
 */
const WINDOW_CONFIG: Record<RateLimitOperation, { requests: number; window: `${number} ${'s' | 'm' | 'h' | 'd'}` }> = {
  generate: { requests: 5,  window: '10 m' },  // 5 generations per 10 minutes
  edit:     { requests: 15, window: '10 m' },  // 15 edits per 10 minutes
  expand:   { requests: 25, window: '10 m' },  // 25 expansions per 10 minutes
};

const _limiters = new Map<RateLimitOperation, Ratelimit>();

function getLimiter(op: RateLimitOperation): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  if (!_limiters.has(op)) {
    const { requests, window } = WINDOW_CONFIG[op];
    _limiters.set(op, new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      prefix: `rl:viz:${op}`,
      analytics: true,
    }));
  }

  return _limiters.get(op)!;
}

export async function checkRateLimit(
  userId: string,
  op: RateLimitOperation
): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
  const limiter = getLimiter(op);

  if (!limiter) {
    // Redis not configured — fail open so the app works without Upstash
    return { allowed: true, remaining: -1 };
  }

  try {
    const { success, remaining, reset } = await limiter.limit(userId);
    return {
      allowed: success,
      remaining,
      retryAfter: success ? undefined : Math.ceil((reset - Date.now()) / 1000),
    };
  } catch {
    // Redis unavailable — fail open rather than blocking legitimate users
    return { allowed: true, remaining: -1 };
  }
}
