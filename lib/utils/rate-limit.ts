import { Ratelimit } from '@upstash/ratelimit';
import { getRedis } from '@/lib/utils/redis';

export type RateLimitOperation = 'generate' | 'edit';

/**
 * Sliding-window limits per operation type.
 * These protect against burst abuse while being generous enough for real usage.
 * Token balance (monthly cap) is a separate, orthogonal concern.
 */
const WINDOW_CONFIG: Record<RateLimitOperation, { requests: number; window: `${number} ${'s' | 'm' | 'h' | 'd'}` }> = {
  generate: { requests: 10, window: '10 m' },  // 10 generations per 10 minutes
  edit:     { requests: 15, window: '10 m' },  // 15 edits per 10 minutes
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
    console.error('[rate-limit] Redis not configured — rate limiting is DISABLED. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.');
    return { allowed: true, remaining: -1 };
  }

  try {
    const { success, remaining, reset, pending } = await limiter.limit(userId);
    // On Vercel Node.js, the function is killed after the response is sent so
    // fire-and-forget promises get cut off. Awaiting `pending` guarantees the
    // analytics write reaches Upstash before this action returns. The .catch()
    // swallows network errors so a failed analytics flush never blocks the user.
    await pending.catch(() => {});
    return {
      allowed: success,
      remaining,
      retryAfter: success ? undefined : Math.ceil((reset - Date.now()) / 1000),
    };
  } catch (err) {
    // Redis unavailable — fail open rather than blocking legitimate users.
    // Token balance acts as the financial backstop.
    console.error('[rate-limit] Redis unavailable, failing open:', err);
    return { allowed: true, remaining: -1 };
  }
}
