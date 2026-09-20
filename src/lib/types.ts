export type SessionType = 'feature' | 'fiction' | 'doc';

export interface Session {
  id: string;
  title: string;
  type: SessionType;
  duration: number;
  color: string | null;
  leadIn: number | null;
  gala?: boolean;
}

export interface Day {
  id: string;
  label: string;
  date: string;
  sessions: Session[];
}

export interface Snapshot {
  v: number;
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
  at: number;
}

export interface PlacedRow {
  session: Session;
  start: number;
  end: number;
  filmStart: number;
  gap: { start: number; dur: number; owner: Session } | null;
}
