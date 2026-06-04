import { Redis } from '@upstash/redis';

let _client: Redis | null = null;

/**
 * Returns a singleton Upstash Redis client, or null if env vars are not set.
 * All callers must handle null gracefully (fail-open) so the app works without Redis.
 */
export function getRedis(): Redis | null {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }

  if (!_client) {
    _client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return _client;
}
