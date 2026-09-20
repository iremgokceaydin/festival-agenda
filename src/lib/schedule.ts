import { INTRO } from './defaults';
import type { Day, PlacedRow, Session } from './types';

/** Minutes a session needs before it, given the configured minimum break. */
export function leadFor(s: Session, isFirst: boolean, minBreak: number): number {
  if (isFirst) return Math.max(0, s.leadIn ?? 0);
  return Math.max(minBreak, s.leadIn ?? minBreak);
}

/** Lay a day's sessions out end-to-end from startMin, inserting gaps (breaks) as needed. */
export function place(sessions: Session[], startMin: number, minBreak: number): { rows: PlacedRow[]; end: number } {
  const out: PlacedRow[] = [];
  let cur = startMin;
  sessions.forEach((s, i) => {
    const lead = leadFor(s, i === 0, minBreak);
    const start = cur + lead;
    out.push({
      session: s,
      start,
      end: start + s.duration + INTRO,
      filmStart: start + INTRO,
      gap: i > 0 && lead > 0 ? { start: cur, dur: lead, owner: s } : null
    });
    cur = start + s.duration + INTRO;
  });
  return { rows: out, end: cur };
}

export function fmt(m: number): string {
  m = Math.round(m);
  const h24 = Math.floor(m / 60) % 24;
  const mm = ('0' + (((m % 60) + 60) % 60)).slice(-2);
  const ap = h24 >= 12 ? 'pm' : 'am';
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return h + ':' + mm + ' ' + ap;
}

export function dur(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return (h ? h + 'h ' : '') + (mm ? mm + 'm' : h ? '' : '0m');
}

export function tint(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return 'rgba(' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',') + ',' + a + ')';
}

export function typeColor(type: Session['type'], featureColor: string, shortColor: string): string {
  return type === 'feature' ? featureColor : shortColor;
}

export function colorOf(s: Session, featureColor: string, shortColor: string, galaColor: string): string {
  if (s.color) return s.color;
  if (s.gala || /gala/i.test(s.title || '')) return galaColor;
  return typeColor(s.type, featureColor, shortColor);
}

/** Keep every untouched session pinned to the clock time it already had. */
export function anchor(list: Session[], starts: Record<string, number>, movingId: string, startMin: number, minBreak: number): Session[] {
  let cur = startMin;
  return list.map((s, i) => {
    let out = s;
    if (s.id !== movingId && starts && starts[s.id] != null) {
      const want = starts[s.id];
      const lead = i === 0 ? Math.max(0, want - cur) : Math.max(minBreak, want - cur);
      out = { ...s, leadIn: lead };
    }
    cur = cur + leadFor(out, i === 0, minBreak) + out.duration + INTRO;
    return out;
  });
}

export function findSession(days: Day[], id: string | null): { day: Day; session: Session } | null {
  if (!id) return null;
  for (const d of days) {
    const s = d.sessions.find((x) => x.id === id);
    if (s) return { day: d, session: s };
  }
  return null;
}
