import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedis } from '../_redis';

const KEY_PREFIX = 'schedule:';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = req.query.id;
  if (typeof id !== 'string' || !id) {
    return res.status(400).json({ error: 'Missing id' });
  }

  let data: unknown;
  try {
    data = await getRedis().get(KEY_PREFIX + id);
  } catch (e) {
    return res.status(500).json({ error: 'Could not load this agenda.' });
  }

  if (!data) return res.status(404).json({ error: 'Not found' });

  return res.status(200).json(data);
}
