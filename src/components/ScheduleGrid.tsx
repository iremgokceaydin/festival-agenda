import type React from 'react';
import { fmt } from '../lib/schedule';
import type { DayView } from '../lib/blocks';
import DayColumn from './DayColumn';

interface Props {
  startMin: number;
  endMin: number;
  pxPerMin: number;
  dayViews: DayView[];
  registerCol: (dayId: string) => (el: HTMLDivElement | null) => void;
  onDown: (e: React.PointerEvent, sessionId: string) => void;
  onResize: (e: React.PointerEvent, kind: 'session' | 'break', sessionId: string) => void;
}

const HEADER_H = 78;

export default function ScheduleGrid({ startMin, endMin, pxPerMin, dayViews, registerCol, onDown, onResize }: Props) {
  const gridH = Math.max(320, (endMin - startMin) * pxPerMin);
  const hourLabels: { top: number; label: string }[] = [];
  const gridLines: { top: number; color: string }[] = [];

  for (let m = startMin - (startMin % 30); m <= endMin; m += 30) {
    if (m < startMin) continue;
    const top = (m - startMin) * pxPerMin;
    gridLines.push({ top, color: m % 60 === 0 ? '#EFE8DB' : '#F7F2E9' });
    if (m % 60 === 0) hourLabels.push({ top, label: fmt(m) });
  }

  return (
    <main style={{ flex: 1, minWidth: 0, overflow: 'auto', padding: '20px 24px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, minWidth: 640 }}>
        <div style={{ width: 76, flex: 'none', position: 'relative' }}>
          <div style={{ height: HEADER_H }} />
          <div style={{ position: 'relative', height: gridH }}>
            {hourLabels.map((h, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: h.top,
                  transform: 'translateY(-50%)',
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 11,
                  color: '#8A7D6D',
                  whiteSpace: 'nowrap'
                }}
              >
                {h.label}
              </div>
            ))}
          </div>
        </div>

        {dayViews.map((day) => (
          <DayColumn
            key={day.id}
            day={day}
            gridH={gridH}
            headerH={HEADER_H}
            gridLines={gridLines}
            registerCol={registerCol(day.id)}
            onDown={onDown}
            onResize={onResize}
          />
        ))}
      </div>
    </main>
  );
}
