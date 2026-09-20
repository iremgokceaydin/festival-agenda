import type React from 'react';
import type { DayView } from '../lib/blocks';
import SessionBlock from './SessionBlock';

interface GridLine {
  top: number;
  color: string;
}

interface Props {
  day: DayView;
  gridH: number;
  headerH: number;
  gridLines: GridLine[];
  registerCol: (el: HTMLDivElement | null) => void;
  onDown: (e: React.PointerEvent, sessionId: string) => void;
  onResize: (e: React.PointerEvent, kind: 'session' | 'break', sessionId: string) => void;
}

export default function DayColumn({ day, gridH, headerH, gridLines, registerCol, onDown, onResize }: Props) {
  return (
    <div style={{ flex: 1, minWidth: 0, borderLeft: '1px solid #E6DDD0' }}>
      <div style={{ height: headerH, padding: '0 12px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, whiteSpace: 'nowrap' }}>
          <span style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 19, fontWeight: 500, color: '#3D2E1F', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {day.label}
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#AFA594', whiteSpace: 'nowrap' }}>{day.date}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#8A7D6D', whiteSpace: 'nowrap' }}>{day.stat}</span>
          {day.overrun && (
            <span
              style={{
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 10.5,
                color: '#7A2E2E',
                background: '#F6E0E0',
                borderRadius: 999,
                padding: '2px 7px',
                whiteSpace: 'nowrap'
              }}
            >
              {day.overrun}
            </span>
          )}
        </div>
      </div>
      <div ref={registerCol} style={{ position: 'relative', height: gridH, background: '#FFFDF8', borderTop: '1px solid #E6DDD0' }}>
        {gridLines.map((g, i) => (
          <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: g.top, height: 1, background: g.color }} />
        ))}
        {day.blocks.map((b) => (
          <SessionBlock key={b.id} block={b} onDown={onDown} onResize={onResize} />
        ))}
      </div>
    </div>
  );
}
