import { DEFAULT_SEED } from './defaults';
import type { Day } from './types';

const STORE = 'festival-weekend-schedule-v1';

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

export function loadDraft(): Draft | null {
  try {
    const raw = window.localStorage.getItem(STORE);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (d && d.seed === DEFAULT_SEED && Array.isArray(d.days)) return d as Draft;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveDraft(draft: Draft): void {
  try {
    window.localStorage.setItem(STORE, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

export function clearDraft(): void {
  try {
    Object.keys(window.localStorage).forEach((k) => {
      if (k.indexOf('festival-weekend-schedule') === 0) window.localStorage.removeItem(k);
    });
  } catch {
    /* ignore */
  }
}
