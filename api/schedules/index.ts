import type { VercelRequest, VercelResponse } from '@vercel/node';
import { nanoid } from 'nanoid';
import { getRedis } from '../_redis';

const ID_LENGTH = 8;
const KEY_PREFIX = 'schedule:';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body;
  if (!body || typeof body !== 'object' || !Array.isArray(body.days)) {
    return res.status(400).json({ error: 'Invalid schedule payload' });
  }

  const id = nanoid(ID_LENGTH);
  try {
    await getRedis().set(KEY_PREFIX + id, body);
  } catch (e) {
    return res.status(500).json({ error: 'Could not save this agenda.' });
  }

  return res.status(201).json({ id });
}
