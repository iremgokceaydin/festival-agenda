import type React from 'react';
import { useCallback, useRef } from 'react';
import { INTRO } from '../lib/defaults';
import { anchor, leadFor, place } from '../lib/schedule';
import type { Day, Session } from '../lib/types';

interface Live {
  days: Day[];
  startMin: number;
  minBreak: number;
  pxPerMin: number;
}

interface DragInfo {
  id: string;
  grab: number;
  starts: Record<string, number>;
  sig?: string;
  raf?: number | null;
}

interface ResizeInfo {
  kind: 'session' | 'break';
  id: string;
  y: number;
  orig: number;
}

export function useDragResize(
  days: Day[],
  setDays: (updater: (days: Day[]) => Day[]) => void,
  startMin: number,
  minBreak: number,
  pxPerMin: number,
  setSelId: (id: string | null) => void,
  setDragId: (id: string | null) => void
) {
  const live = useRef<Live>({ days, startMin, minBreak, pxPerMin });
  live.current = { days, startMin, minBreak, pxPerMin };

  const cols = useRef<Record<string, HTMLDivElement | null>>({});
  const drag = useRef<DragInfo | null>(null);
  const rz = useRef<ResizeInfo | null>(null);

  const registerCol = useCallback((dayId: string) => (el: HTMLDivElement | null) => {
    cols.current[dayId] = el;
  }, []);

  const findSession = useCallback((id: string): { day: Day; session: Session } | null => {
    for (const d of live.current.days) {
      const s = d.sessions.find((x) => x.id === id);
      if (s) return { day: d, session: s };
    }
    return null;
  }, []);

  const moveDrag = useCallback((e: PointerEvent) => {
    const info = drag.current;
    if (!info) return;
    const { days: liveDays, startMin: sMin, minBreak: mb, pxPerMin: ppm } = live.current;

    let target: Day | null = null;
    let rect: DOMRect | null = null;
    let best = Infinity;
    for (const d of liveDays) {
      const el = cols.current[d.id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const dist = e.clientX < r.left ? r.left - e.clientX : e.clientX > r.right ? e.clientX - r.right : 0;
      if (dist < best) {
        best = dist;
        target = d;
        rect = r;
      }
    }
    if (!target || !rect) return;
    const found = findSession(info.id);
    if (!found) return;

    const minute = sMin + (e.clientY - rect.top - info.grab) / ppm;
    const desired = Math.round(minute / 5) * 5;

    const t = target;
    const others = t.sessions
      .filter((x) => x.id !== info.id)
      .slice()
      .sort((a, b) => (info.starts[a.id] ?? 0) - (info.starts[b.id] ?? 0));

    let idx = others.length;
    for (let i = 0; i < others.length; i++) {
      const st0 = info.starts[others[i].id];
      if (st0 == null) continue;
      if (desired < st0 + (others[i].duration + INTRO) / 2) {
        idx = i;
        break;
      }
    }
    const prev = idx > 0 ? others[idx - 1] : null;
    const prevEnd = prev ? (info.starts[prev.id] ?? sMin) + prev.duration + INTRO : sMin;
    const lead = idx === 0 ? Math.max(0, desired - sMin) : Math.max(mb, desired - prevEnd);

    const sig = t.id + ':' + idx + ':' + lead;
    if (info.sig === sig) return;
    info.sig = sig;

    const moving = { ...found.session, leadIn: lead };
    const next = anchor(others.slice(0, idx).concat([moving], others.slice(idx)), info.starts, info.id, sMin, mb);

    setDays((cur) =>
      cur.map((d) => {
        if (d.id === t.id) return { ...d, sessions: next };
        if (d.id === found.day.id) return { ...d, sessions: anchor(d.sessions.filter((x) => x.id !== info.id), info.starts, info.id, sMin, mb) };
        return d;
      })
    );
  }, [findSession, setDays]);

  const endDrag = useCallback(() => {
    drag.current = null;
    setDragId(null);
    window.removeEventListener('pointermove', moveDrag);
    window.removeEventListener('pointerup', endDrag);
  }, [moveDrag, setDragId]);

  const startDrag = useCallback((e: React.PointerEvent, sessionId: string) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const starts: Record<string, number> = {};
    const { days: liveDays, startMin: sMin, minBreak: mb } = live.current;
    liveDays.forEach((d) => place(d.sessions, sMin, mb).rows.forEach((r) => { starts[r.session.id] = r.start; }));
    drag.current = { id: sessionId, grab: e.clientY - rect.top, starts };
    setSelId(sessionId);
    setDragId(sessionId);
    window.addEventListener('pointermove', moveDrag);
    window.addEventListener('pointerup', endDrag);
  }, [endDrag, moveDrag, setDragId, setSelId]);

  const moveResize = useCallback((e: PointerEvent) => {
    const r = rz.current;
    if (!r) return;
    const { minBreak: mb, pxPerMin: ppm } = live.current;
    const delta = (e.clientY - r.y) / ppm;
    let next = Math.round((r.orig + delta) / 5) * 5;
    if (r.kind === 'session') next = Math.max(10, Math.min(400, next));
    else next = Math.max(mb, Math.min(240, next));

    setDays((cur) =>
      cur.map((d) => ({
        ...d,
        sessions: d.sessions.map((x) => (x.id === r.id ? { ...x, ...(r.kind === 'session' ? { duration: next } : { leadIn: next }) } : x))
      }))
    );
  }, [setDays]);

  const endResize = useCallback(() => {
    rz.current = null;
    window.removeEventListener('pointermove', moveResize);
    window.removeEventListener('pointerup', endResize);
  }, [moveResize]);

  const startResize = useCallback((e: React.PointerEvent, kind: 'session' | 'break', sessionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const found = findSession(sessionId);
    if (!found) return;
    const isFirst = found.day.sessions[0] && found.day.sessions[0].id === sessionId;
    const { minBreak: mb } = live.current;
    rz.current = {
      kind,
      id: sessionId,
      y: e.clientY,
      orig: kind === 'session' ? found.session.duration : leadFor(found.session, isFirst, mb)
    };
    if (kind === 'session') setSelId(sessionId);
    window.addEventListener('pointermove', moveResize);
    window.addEventListener('pointerup', endResize);
  }, [endResize, findSession, moveResize, setSelId]);

  return { registerCol, startDrag, startResize };
}
