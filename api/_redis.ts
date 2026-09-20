import { Redis } from '@upstash/redis';

let client: Redis | null = null;

/**
 * Vercel's Redis Marketplace integration (Upstash) injects REST credentials
 * under KV_REST_API_* for back-compat with the old Vercel KV product; a
 * store connected directly through Upstash uses UPSTASH_REDIS_REST_*.
 * Accept either so this works regardless of how the store was attached.
 */
export function getRedis(): Redis {
  if (client) return client;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error('No Redis store is configured. Attach a Redis integration to this Vercel project.');
  }
  client = new Redis({ url, token });
  return client;
}
