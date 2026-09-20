import type React from 'react';

interface Props {
  agendaName: string;
  onNameChange: (v: string) => void;
  rangeLabel: string;
  snapshotNote: string | null;

  dayCount: 2 | 3;
  onDayCountChange: (n: 2 | 3) => void;

  startValue: string;
  endValue: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;

  minBreakValue: number;
  onMinBreakChange: (v: number) => void;
  breakColorValue: string;
  onBreakColorChange: (c: string) => void;

  zoomValue: number;
  zoomLabel: string;
  onZoomChange: (v: number) => void;

  onExportPdf: () => void;
  onExportCsv: () => void;

  onReset: () => void;

  naming: boolean;
  nameDraft: string;
  onNameDraft: (v: string) => void;
  onNameKeyDown: (e: React.KeyboardEvent) => void;
  nameRef: (el: HTMLInputElement | null) => void;
  onNamingCancel: () => void;

  shareUrl: string | null;
  urlRef: (el: HTMLInputElement | null) => void;
  onUrlFocus: (e: React.SyntheticEvent<HTMLInputElement>) => void;

  importing: boolean;
  importDraft: string;
  onImportDraft: (v: string) => void;
  importRef: (el: HTMLInputElement | null) => void;
  importError: string | null;
  onImportOpen: () => void;
  onImportApply: () => void;

  onShare: () => void;
  shareAction: string;
  shareError: string | null;
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
  color: '#6B6056'
};

const BREAK_SWATCHES = ['#8A7D6D', '#AFA594', '#CFC5B2', '#5B4A3A'];

export default function Header(props: Props) {
  const noShareUrl = !props.importing && !props.shareUrl;

  return (
    <header
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 20,
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        padding: '20px 28px 16px',
        borderBottom: '1px solid #E6DDD0',
        background: '#FFFDF8'
      }}
    >
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#B8552E' }}>Programming</div>
        <input
          type="text"
          value={props.agendaName}
          onChange={(e) => props.onNameChange(e.target.value)}
          placeholder="Festival Weekend Schedule"
          data-keep-selection=""
          style={{
            margin: '4px 0 0',
            padding: 0,
            width: '100%',
            maxWidth: 520,
            border: 'none',
            background: 'transparent',
            borderRadius: 0,
            fontFamily: "'Newsreader',Georgia,serif",
            fontWeight: 500,
            fontSize: 34,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: '#3D2E1F'
          }}
        />
        <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#8A7D6D' }}>{props.rangeLabel}</span>
          {props.snapshotNote && (
            <span
              style={{
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 10.5,
                color: '#7A5A1F',
                background: '#F6ECD9',
                borderRadius: 999,
                padding: '3px 8px',
                whiteSpace: 'nowrap'
              }}
            >
              {props.snapshotNote}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={fieldLabelStyle}>Festival days</span>
          <div style={{ display: 'flex', gap: 0, border: '1px solid #E6DDD0', borderRadius: 6, overflow: 'hidden', background: '#FBF8F2' }}>
            {([3, 2] as const).map((n) => (
              <button
                key={n}
                onClick={() => props.onDayCountChange(n)}
                style={{
                  border: 'none',
                  padding: '7px 12px',
                  fontSize: 12.5,
                  whiteSpace: 'nowrap',
                  flex: 'none',
                  cursor: 'pointer',
                  background: props.dayCount === n ? '#2A2520' : 'transparent',
                  color: props.dayCount === n ? '#FFFDF8' : '#6B6056'
                }}
              >
                {n === 3 ? 'Fri – Sun' : 'Sat – Sun'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={fieldLabelStyle}>Screening window</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5 }}>
            <input type="time" value={props.startValue} onChange={(e) => props.onStartChange(e.target.value)} style={{ width: 'auto', minWidth: 142 }} />
            <span style={{ color: '#AFA594' }}>to</span>
            <input type="time" value={props.endValue} onChange={(e) => props.onEndChange(e.target.value)} style={{ width: 'auto', minWidth: 142 }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={fieldLabelStyle}>Min break</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              min={5}
              max={120}
              step={5}
              value={props.minBreakValue}
              onChange={(e) => props.onMinBreakChange(Math.max(5, parseInt(e.target.value || '0', 10) || 5))}
              style={{ width: 68, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5 }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              {BREAK_SWATCHES.map((c) => (
                <button
                  key={c}
                  onClick={() => props.onBreakColorChange(c)}
                  title="Break colour"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    cursor: 'pointer',
                    background: c,
                    border: props.breakColorValue.toLowerCase() === c.toLowerCase() ? '2px solid #2A2520' : '1px solid rgba(42,37,32,0.12)',
                    padding: 0
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={fieldLabelStyle}>Zoom</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 33 }}>
            <input
              type="range"
              min={0.6}
              max={1.8}
              step={0.05}
              value={props.zoomValue}
              onChange={(e) => props.onZoomChange(parseFloat(e.target.value))}
              style={{ width: 104, accentColor: '#B8552E' }}
            />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: '#8A7D6D', width: 40, whiteSpace: 'nowrap' }}>{props.zoomLabel}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={fieldLabelStyle}>Export</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 33 }}>
            <button onClick={props.onExportPdf} className="hover-panel" style={buttonStyle}>
              PDF
            </button>
            <button onClick={props.onExportCsv} className="hover-panel" style={buttonStyle}>
              CSV
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={fieldLabelStyle}>Snapshot</span>
          <div data-keep-selection="" style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
            {props.naming && (
              <div
                style={{
                  position: 'absolute',
                  top: 40,
                  right: 0,
                  zIndex: 60,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  width: 288,
                  padding: 12,
                  border: '1px solid #E6DDD0',
                  borderRadius: 8,
                  background: '#FFFDF8',
                  boxShadow: '0 12px 28px -10px rgba(61,46,31,0.28)'
                }}
              >
                {noShareUrl && (
                  <>
                    <span style={fieldLabelStyle}>Name this agenda</span>
                    <input
                      type="text"
                      value={props.nameDraft}
                      onChange={(e) => props.onNameDraft(e.target.value)}
                      onKeyDown={props.onNameKeyDown}
                      ref={props.nameRef}
                      placeholder="Festival Weekend Schedule"
                      style={{ fontSize: 13.5 }}
                    />
                    {props.shareError && <span style={{ fontSize: 11, color: '#7A2E2E' }}>{props.shareError}</span>}
                  </>
                )}
                {!props.importing && props.shareUrl && (
                  <>
                    <span style={fieldLabelStyle}>Select and copy — ⌘C / Ctrl+C</span>
                    <input
                      type="text"
                      readOnly
                      value={props.shareUrl}
                      ref={props.urlRef}
                      onFocus={props.onUrlFocus}
                      onClick={props.onUrlFocus}
                      style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#5B4A3A' }}
                    />
                  </>
                )}
                {props.importing && (
                  <>
                    <span style={fieldLabelStyle}>Paste a share link or code</span>
                    <input
                      type="text"
                      value={props.importDraft}
                      onChange={(e) => props.onImportDraft(e.target.value)}
                      ref={props.importRef}
                      placeholder="https://… or a share code"
                      style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11 }}
                    />
                    {props.importError && <span style={{ fontSize: 11, color: '#7A2E2E' }}>{props.importError}</span>}
                    <button
                      onClick={props.onImportApply}
                      style={{ border: 'none', background: '#B8552E', color: '#FFFDF8', borderRadius: 6, padding: 8, fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}
                    >
                      Load schedule
                    </button>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  {noShareUrl && (
                    <button onClick={props.onImportOpen} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 11.5, color: '#B8552E', padding: 0 }}>
                      Paste a link instead
                    </button>
                  )}
                  <button onClick={props.onNamingCancel} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 11.5, color: '#8A7D6D', marginLeft: 'auto', padding: 0 }}>
                    Close
                  </button>
                </div>
              </div>
            )}
            <button onClick={props.onReset} title="Discard local changes and reload the default programme" className="hover-panel" style={buttonStyle}>
              Reset
            </button>
            <button onClick={props.onShare} className="hover-panel" style={{ ...buttonStyle, width: 142, textAlign: 'center' }}>
              {props.shareAction}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

const buttonStyle: React.CSSProperties = {
  border: '1px solid #E6DDD0',
  background: '#FBF8F2',
  borderRadius: 6,
  padding: '7px 12px',
  fontWeight: 600,
  fontSize: 12.5,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  color: '#3D2E1F',
  flex: 'none'
};
