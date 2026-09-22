export interface SnapshotEntry {
  id: string;
  name: string;
  at: number;
}

const KEY = 'festival-weekend-schedule-snapshots-v1';
const MAX_ENTRIES = 25;

export function loadSnapshotList(): SnapshotEntry[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addSnapshotEntry(entry: SnapshotEntry): SnapshotEntry[] {
  const list = [entry, ...loadSnapshotList().filter((e) => e.id !== entry.id)].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  return list;
}
