import type { VercelRequest, VercelResponse } from '@vercel/node';
import { nanoid } from 'nanoid';
import { getRedis } from '../_redis.js';
import { INDEX_KEY, KEY_PREFIX } from '../_keys.js';

const ID_LENGTH = 8;
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
  const requestedName = ((body.name as string) || 'Untitled agenda').trim().slice(0, 200) || 'Untitled agenda';

  try {
    const redis = getRedis();
    const existing = await redis.hgetall<Record<string, IndexEntry>>(INDEX_KEY);
    const existingNames = new Set(Object.values(existing || {}).map((e) => e.name));
    const name = uniqueName(requestedName, existingNames);

    const entry: IndexEntry = { name, at: typeof body.at === 'number' ? body.at : Date.now() };
    await redis.set(KEY_PREFIX + id, { ...body, name });
    // The client JSON-serializes non-string hash values automatically (same
    // as set/get above) — keep this consistent, no manual stringify/parse.
    await redis.hset(INDEX_KEY, { [id]: entry });

    return res.status(201).json({ id, name });
  } catch (e) {
    return res.status(500).json({ error: 'Could not save this agenda.' });
  }
}

// "Name" -> "Name (1)" -> "Name (2)" ... against every currently saved
// snapshot name, site-wide (case-sensitive, exact match).
function uniqueName(base: string, existingNames: Set<string>): string {
  if (!existingNames.has(base)) return base;
  let n = 1;
  while (existingNames.has(`${base} (${n})`)) n++;
  return `${base} (${n})`;
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
