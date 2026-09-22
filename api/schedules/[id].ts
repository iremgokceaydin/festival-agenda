import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedis } from '../_redis.js';
import { INDEX_KEY, KEY_PREFIX } from '../_keys.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id;
  if (typeof id !== 'string' || !id) {
    return res.status(400).json({ error: 'Missing id' });
  }

  if (req.method === 'GET') return handleGet(id, res);
  if (req.method === 'DELETE') return handleDelete(id, res);
  res.setHeader('Allow', 'GET, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(id: string, res: VercelResponse) {
  let data: unknown;
  try {
    data = await getRedis().get(KEY_PREFIX + id);
  } catch (e) {
    return res.status(500).json({ error: 'Could not load this agenda.' });
  }

  if (!data) return res.status(404).json({ error: 'Not found' });

  return res.status(200).json(data);
}

async function handleDelete(id: string, res: VercelResponse) {
  try {
    const redis = getRedis();
    await Promise.all([redis.del(KEY_PREFIX + id), redis.hdel(INDEX_KEY, id)]);
  } catch (e) {
    return res.status(500).json({ error: 'Could not delete this agenda.' });
  }

  return res.status(204).end();
}
