import { DEFAULT_SEED } from './defaults';
import type { Day } from './types';

// Each snapshot (identified by its share id) gets its own draft slot, so
// switching between snapshots via the header dropdown never clobbers another
// snapshot's unsaved local edits. `null` id is the scratch working copy that
// exists before anything has ever been shared.
const DRAFT_PREFIX = 'festival-weekend-schedule-draft:';
const LOCAL_ID = 'local';

export interface Draft {
  seed: string;
  name: string;
  days: Day[];
  altDays: Day[];
  dayCount: 2 | 3;
  startMin: number;
  endMin: number;
  minBreak: number | null;
  breakColor: string | null;
  zoom: number | null;
}

function keyFor(id: string | null): string {
  return DRAFT_PREFIX + (id || LOCAL_ID);
}

export function loadDraft(id: string | null): Draft | null {
  try {
    const raw = window.localStorage.getItem(keyFor(id));
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || !Array.isArray(d.days)) return null;
    // The scratch copy (no snapshot id) is tied to the app's current default
    // programme; a shared snapshot's draft has no such dependency.
    if (id === null && d.seed !== DEFAULT_SEED) return null;
    return d as Draft;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveDraft(id: string | null, draft: Draft): void {
  try {
    window.localStorage.setItem(keyFor(id), JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

export function clearDraft(id: string | null): void {
  try {
    window.localStorage.removeItem(keyFor(id));
  } catch {
    /* ignore */
  }
}
