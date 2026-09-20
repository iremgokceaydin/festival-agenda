import type React from 'react';
import type { BlockView } from '../lib/blocks';

interface Props {
  block: BlockView;
  onDown: (e: React.PointerEvent, sessionId: string) => void;
  onResize: (e: React.PointerEvent, kind: 'session' | 'break', sessionId: string) => void;
}

export default function SessionBlock({ block: b, onDown, onResize }: Props) {
  return (
    <div
      data-block=""
      style={{
        position: 'absolute',
        left: 5,
        right: 5,
        top: b.top,
        height: b.h,
        padding: b.outerPad,
        zIndex: b.z
      }}
    >
      <div
        onPointerDown={b.kind === 'session' ? (e) => onDown(e, b.sessionId) : undefined}
        style={{
          height: '100%',
          borderRadius: 7,
          border: `1px ${b.borderStyle} ${b.borderCol}`,
          background: b.bg,
          boxShadow: b.shadow,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
          cursor: b.cursor,
          transition: 'box-shadow 120ms ease'
        }}
      >
        <div style={{ width: b.barW, flex: 'none', background: b.bar }} />
        {b.showIntro && (
          <div
            style={{
              position: 'absolute',
              left: b.barW,
              right: 0,
              top: 0,
              height: b.introH,
              background: b.introTint,
              display: 'flex',
              alignItems: 'center',
              padding: '0 9px',
              overflow: 'hidden'
            }}
          >
            <span
              style={{
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 9,
                lineHeight: 1,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: '#2A2520',
                whiteSpace: 'nowrap'
              }}
            >
              {b.introLabel}
            </span>
          </div>
        )}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            height: '100%',
            padding: b.pad,
            paddingTop: b.introH,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 1,
            overflow: 'hidden'
          }}
        >
          {b.showTitle && (
            <div
              style={{
                fontFamily: b.titleFont,
                fontSize: b.titleSize,
                fontWeight: b.titleWeight,
                lineHeight: b.lineH,
                color: b.titleCol,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {b.title}
            </div>
          )}
          {b.showMeta && (
            <div
              style={{
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 10.5,
                color: '#6B6056',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {b.sub}
            </div>
          )}
        </div>
        <div
          onPointerDown={(e) => onResize(e, b.kind === 'gap' ? 'break' : 'session', b.sessionId)}
          title="Drag to change length"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 9, cursor: 'ns-resize' }}
        />
      </div>
    </div>
  );
}
