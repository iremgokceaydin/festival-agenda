import type { Snapshot } from './types';

const API_BASE = '/api/schedules';

export interface CreateShareResult {
  id: string;
  name: string;
}

// The server may rename the snapshot to keep it unique (e.g. "Name" ->
// "Name (1)") — the returned name is the one actually saved.
export async function createShare(snapshot: Snapshot): Promise<CreateShareResult> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot)
  });
  if (!res.ok) throw new Error('Could not save this agenda.');
  const data = await res.json();
  return { id: data.id as string, name: (data.name as string) || snapshot.name };
}

export async function fetchShare(id: string): Promise<Snapshot> {
  const res = await fetch(API_BASE + '/' + encodeURIComponent(id));
  if (!res.ok) throw new Error('That code could not be read.');
  return (await res.json()) as Snapshot;
}

export interface SnapshotIndexEntry {
  id: string;
  name: string;
  at: number;
}

export async function listSnapshots(): Promise<SnapshotIndexEntry[]> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error('Could not load saved snapshots.');
  return (await res.json()) as SnapshotIndexEntry[];
}
