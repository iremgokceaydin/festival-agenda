import type { VercelRequest, VercelResponse } from '@vercel/node';
import { nanoid } from 'nanoid';
import { getRedis } from '../_redis.js';

const ID_LENGTH = 8;
const KEY_PREFIX = 'schedule:';
const INDEX_KEY = 'schedules:index';
const LIST_LIMIT = 200;

interface IndexEntry {
  name: string;
  at: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleCreate(req: VercelRequest, res: VercelResponse) {
  const body = req.body;
  if (!body || typeof body !== 'object' || !Array.isArray(body.days)) {
    return res.status(400).json({ error: 'Invalid schedule payload' });
  }

  const id = nanoid(ID_LENGTH);
  const entry: IndexEntry = { name: (body.name || 'Untitled agenda').slice(0, 200), at: typeof body.at === 'number' ? body.at : Date.now() };
  try {
    const redis = getRedis();
    await redis.set(KEY_PREFIX + id, body);
    // The client JSON-serializes non-string hash values automatically (same
    // as set/get above) — keep this consistent, no manual stringify/parse.
    await redis.hset(INDEX_KEY, { [id]: entry });
  } catch (e) {
    return res.status(500).json({ error: 'Could not save this agenda.' });
  }

  return res.status(201).json({ id });
}

async function handleList(req: VercelRequest, res: VercelResponse) {
  try {
    const raw = await getRedis().hgetall<Record<string, IndexEntry>>(INDEX_KEY);
    const entries = Object.entries(raw || {})
      .filter((pair): pair is [string, IndexEntry] => !!pair[1] && typeof pair[1] === 'object')
      .map(([id, entry]) => ({ id, name: entry.name, at: entry.at }))
      .sort((a, b) => b.at - a.at)
      .slice(0, LIST_LIMIT);

    return res.status(200).json(entries);
  } catch (e) {
    return res.status(500).json({ error: 'Could not load saved snapshots.' });
  }
}
