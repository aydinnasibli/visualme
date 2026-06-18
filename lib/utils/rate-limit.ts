import { Ratelimit } from '@upstash/ratelimit';
import { getRedis } from '@/lib/utils/redis';

export type RateLimitOperation =
  | 'generate' | 'edit' | 'live-data'
  | 'save' | 'delete' | 'duplicate' | 'export' | 'share' | 'dashboard';

const WINDOW_CONFIG: Record<RateLimitOperation, { requests: number; window: `${number} ${'s' | 'm' | 'h' | 'd'}` }> = {
  generate:    { requests: 10, window: '10 m' },
  edit:        { requests: 15, window: '10 m' },
  'live-data': { requests: 30, window: '1 m' },
  save:        { requests: 20, window: '1 m' },
  delete:      { requests: 10, window: '1 m' },
  duplicate:   { requests: 10, window: '1 m' },
  export:      { requests: 15, window: '1 m' },
  share:       { requests: 10, window: '1 m' },
  dashboard:   { requests: 10, window: '1 m' },
};

const _limiters = new Map<RateLimitOperation, Ratelimit>();
let _redisWarningLogged = false;

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
    if (!_redisWarningLogged) {
      console.warn('[rate-limit] Redis not configured — rate limiting is DISABLED. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.');
      _redisWarningLogged = true;
    }
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
