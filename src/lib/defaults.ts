import type { Day, Session, SessionType } from './types';

export const PALETTE = ['#3A5A7A', '#C06A34', '#567A63', '#A07A2E', '#6E5A8C', '#5B4A3A', '#A44040', '#8A7D6D'];

export const TYPES: { id: SessionType; label: string; tag: string }[] = [
  { id: 'feature', label: 'Feature film', tag: 'FEATURE' },
  { id: 'fiction', label: 'Short films — fiction', tag: 'SHORTS · FICTION' },
  { id: 'doc', label: 'Short films — documentary', tag: 'SHORTS · DOC' }
];

export const INTRO = 5;

export const DEFAULT_FEATURE_COLOR = '#3A5A7A';
export const DEFAULT_SHORT_COLOR = '#C06A34';
export const DEFAULT_GALA_COLOR = '#3F6B52';
export const DEFAULT_BREAK_COLOR = '#8A7D6D';
export const DEFAULT_PX_PER_MIN = 1.05;

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function mk(title: string, type: SessionType, duration: number, color: string | null = null): Session {
  return { id: uid(), title, type, duration, color: color || null, leadIn: null };
}

export const DEFAULT_DAYS: Day[] = [
  {
    id: 'fri',
    label: 'Friday',
    date: 'Oct 16',
    sessions: [
      Object.assign(mk('Feature #1', 'feature', 100), { leadIn: 360 }),
      mk('Feature #2', 'feature', 100),
      mk('Feature #3', 'feature', 100)
    ]
  },
  {
    id: 'sat',
    label: 'Saturday',
    date: 'Oct 17',
    sessions: [
      Object.assign(mk('Shorts — Fiction #1', 'fiction', 90), { leadIn: 90 }),
      mk('Shorts — Fiction #2', 'fiction', 90),
      mk('Feature #4', 'feature', 100),
      Object.assign(mk('Feature #5 - GALA Film', 'feature', 100), { gala: true })
    ]
  },
  {
    id: 'sun',
    label: 'Sunday',
    date: 'Oct 18',
    sessions: [
      Object.assign(mk('Shorts — Documentary #1', 'doc', 90), { leadIn: 30 }),
      mk('Feature #6', 'feature', 100),
      mk('Feature #7', 'feature', 100),
      mk('Feature #8', 'feature', 100),
      mk('Feature #9', 'feature', 100)
    ]
  }
];

export const DEFAULT_DAYS_2: Day[] = [
  {
    id: 'sat',
    label: 'Saturday',
    date: 'Oct 17',
    sessions: [
      Object.assign(mk('Shorts — Fiction #1', 'fiction', 90), { leadIn: 90 }),
      mk('Shorts — Fiction #2', 'fiction', 90),
      mk('Feature #1', 'feature', 100),
      Object.assign(mk('Feature #2 - GALA Film', 'feature', 100), { gala: true })
    ]
  },
  {
    id: 'sun',
    label: 'Sunday',
    date: 'Oct 18',
    sessions: [
      mk('Shorts — Documentary #1', 'doc', 90),
      mk('Feature #3', 'feature', 100),
      mk('Feature #4', 'feature', 100),
      mk('Feature #5', 'feature', 100),
      mk('Feature #6', 'feature', 100),
      mk('Feature #7', 'feature', 100)
    ]
  }
];

// The screening window itself is always 11am–11pm; each day's actual first
// clock time comes from its first session's leadIn (e.g. Friday's leadIn of
// 360 min pushes its first block to 5pm within that window).
export const DEFAULT_START_MIN = 11 * 60;
export const DEFAULT_END_MIN = 23 * 60;

export function cloneDays(days: Day[]): Day[] {
  return days.map((d) => ({ ...d, sessions: d.sessions.map((s) => ({ ...s, id: uid() })) }));
}

export function seedHash(days: Day[]): string {
  const str = JSON.stringify(
    days.map((d) => [
      d.id,
      d.label,
      d.date,
      d.sessions.map((s) => [s.title, s.type, s.duration, s.color || '', s.leadIn ?? '', s.gala ? 1 : 0])
    ])
  );
  let a = 5381;
  for (let i = 0; i < str.length; i++) a = ((a * 33) ^ str.charCodeAt(i)) >>> 0;
  return 'seed-' + a.toString(36);
}

export const DEFAULT_SEED = seedHash(DEFAULT_DAYS.concat(DEFAULT_DAYS_2));
