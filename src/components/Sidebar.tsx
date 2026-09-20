import type React from 'react';
import { DEFAULT_BREAK_COLOR, DEFAULT_FEATURE_COLOR, DEFAULT_GALA_COLOR, DEFAULT_SHORT_COLOR, PALETTE, TYPES } from '../lib/defaults';
import { tint, typeColor } from '../lib/schedule';
import type { SessionType } from '../lib/types';

export interface SelectedInfo {
  title: string;
  duration: number;
  timeLabel: string;
  type: SessionType;
  color: string | null;
  resolvedColor: string;
}

export interface DraftSession {
  title: string;
  type: SessionType;
  duration: number;
  dayId: string;
  color: string | null;
}

interface Props {
  selected: SelectedInfo | null;
  onSelTitle: (v: string) => void;
  onSelDuration: (v: number) => void;
  onSelType: (v: SessionType) => void;
  onSelColor: (v: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDeselect: () => void;

  draft: DraftSession;
  dayOptions: { id: string; label: string }[];
  onDraftTitle: (v: string) => void;
  onDraftDuration: (v: number) => void;
  onDraftDay: (v: string) => void;
  onDraftType: (v: SessionType) => void;
  onDraftColor: (v: string) => void;
  onAdd: () => void;

  minBreakValue: number;
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
  color: '#6B6056'
};

function TypeOptions({ active, onPick, activeColor }: { active: SessionType; onPick: (t: SessionType) => void; activeColor: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {TYPES.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onPick(t.id)}
            style={{
              textAlign: 'left',
              border: `1px solid ${isActive ? tint(activeColor, 0.5) : '#E6DDD0'}`,
              background: isActive ? tint(activeColor, 0.14) : '#FBF8F2',
              color: '#3D2E1F',
              borderRadius: 6,
              padding: '7px 10px',
              fontSize: 12.5,
              cursor: 'pointer'
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function SwatchRow({ active, onPick, size = 24 }: { active: string | null; onPick: (c: string) => void; size?: number }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {PALETTE.map((c) => {
        const isActive = !!active && active.toLowerCase() === c.toLowerCase();
        return (
          <button
            key={c}
            onClick={() => onPick(c)}
            style={{
              width: size,
              height: size,
              borderRadius: 5,
              cursor: 'pointer',
              padding: 0,
              background: c,
              border: isActive ? '2px solid #2A2520' : '1px solid rgba(42,37,32,0.12)'
            }}
          />
        );
      })}
    </div>
  );
}

export default function Sidebar(props: Props) {
  const { selected } = props;

  return (
    <aside
      data-keep-selection=""
      style={{
        width: 302,
        flex: 'none',
        borderRight: '1px solid #E6DDD0',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        background: '#FFFDF8',
        overflow: 'auto'
      }}
    >
      {selected ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500, fontSize: 20, color: '#3D2E1F' }}>Edit session</h2>
            <button onClick={props.onDeselect} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 11.5, color: '#8A7D6D', padding: 0 }}>
              Done
            </button>
          </div>
          <label style={labelStyle}>
            Title
            <input
              type="text"
              value={selected.title}
              onChange={(e) => props.onSelTitle(e.target.value)}
              style={{ fontSize: 14, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#2A2520' }}
            />
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelStyle}>Kind</span>
            <TypeOptions active={selected.type} onPick={props.onSelType} activeColor={selected.resolvedColor} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <label style={labelStyle}>
              Runtime (min)
              <input
                type="number"
                min={5}
                max={400}
                step={5}
                value={selected.duration}
                onChange={(e) => props.onSelDuration(Math.max(5, parseInt(e.target.value || '0', 10) || 5))}
                style={{ width: 96, fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 400, letterSpacing: 0, color: '#2A2520' }}
              />
            </label>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#8A7D6D', paddingBottom: 8 }}>{selected.timeLabel}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelStyle}>Colour</span>
            <SwatchRow active={selected.color || selected.resolvedColor} onPick={props.onSelColor} />
          </div>
          <div style={{ display: 'flex', gap: 8, paddingTop: 2 }}>
            <button
              onClick={props.onDuplicate}
              style={{ flex: 1, border: '1px solid #E6DDD0', background: '#FBF8F2', borderRadius: 6, padding: 8, fontSize: 12.5, cursor: 'pointer' }}
            >
              Duplicate
            </button>
            <button
              onClick={props.onDelete}
              style={{ flex: 1, border: '1px solid #EECECE', background: '#F6E0E0', color: '#7A2E2E', borderRadius: 6, padding: 8, fontSize: 12.5, cursor: 'pointer' }}
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 style={{ margin: 0, fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500, fontSize: 20, color: '#3D2E1F' }}>Add a session</h2>
          <label style={labelStyle}>
            Title
            <input
              type="text"
              value={props.draft.title}
              onChange={(e) => props.onDraftTitle(e.target.value)}
              placeholder="Film or block name"
              style={{ fontSize: 14, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#2A2520' }}
            />
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelStyle}>Kind</span>
            <TypeOptions active={props.draft.type} onPick={props.onDraftType} activeColor={typeColor(props.draft.type, DEFAULT_FEATURE_COLOR, DEFAULT_SHORT_COLOR)} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <label style={labelStyle}>
              Runtime (min)
              <input
                type="number"
                min={5}
                max={400}
                step={5}
                value={props.draft.duration}
                onChange={(e) => props.onDraftDuration(Math.max(5, parseInt(e.target.value || '0', 10) || 5))}
                style={{ width: 96, fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 400, letterSpacing: 0, color: '#2A2520' }}
              />
            </label>
            <label style={{ ...labelStyle, flex: 1 }}>
              Day
              <select
                value={props.draft.dayId}
                onChange={(e) => props.onDraftDay(e.target.value)}
                style={{ fontSize: 13, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#2A2520' }}
              >
                {props.dayOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelStyle}>Colour</span>
            <SwatchRow active={props.draft.color || typeColor(props.draft.type, DEFAULT_FEATURE_COLOR, DEFAULT_SHORT_COLOR)} onPick={props.onDraftColor} />
          </div>
          <button
            onClick={props.onAdd}
            style={{
              border: 'none',
              background: '#B8552E',
              color: '#FFFDF8',
              borderRadius: 6,
              padding: 11,
              fontWeight: 600,
              fontSize: 13.5,
              letterSpacing: '0.005em',
              cursor: 'pointer'
            }}
          >
            Add to schedule
          </button>
        </div>
      )}

      <div style={{ height: 1, background: '#E6DDD0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={labelStyle}>Legend</span>
        {[
          { color: DEFAULT_FEATURE_COLOR, label: 'Feature film — includes 5 min intro' },
          { color: DEFAULT_GALA_COLOR, label: 'Gala screening' },
          { color: DEFAULT_SHORT_COLOR, label: 'Short films (fiction / doc)' },
          { color: DEFAULT_BREAK_COLOR, label: `Break — ${props.minBreakValue} min minimum` }
        ].map((l) => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#5B4A3A' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, flex: 'none', background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      <p style={{ margin: 0, fontFamily: "'Newsreader',Georgia,serif", fontSize: 13.5, lineHeight: 1.6, color: '#6B6056' }}>
        Drag a block anywhere — into another slot, another day, or down to a later hour with open time before it. It carries its {props.minBreakValue}-minute
        break and everything after it shifts. Drag the bottom edge of a session or a break to stretch it. Breaks hold a {props.minBreakValue}-minute minimum.
      </p>
    </aside>
  );
}
