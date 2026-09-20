import type { Snapshot } from './types';

const API_BASE = '/api/schedules';

export async function createShare(snapshot: Snapshot): Promise<string> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot)
  });
  if (!res.ok) throw new Error('Could not save this agenda.');
  const data = await res.json();
  return data.id as string;
}

export async function fetchShare(id: string): Promise<Snapshot> {
  const res = await fetch(API_BASE + '/' + encodeURIComponent(id));
  if (!res.ok) throw new Error('That code could not be read.');
  return (await res.json()) as Snapshot;
}
