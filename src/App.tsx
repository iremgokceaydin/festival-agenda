import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchShare, createShare } from './lib/api';
import { buildDayView } from './lib/blocks';
import {
  DEFAULT_BREAK_COLOR,
  DEFAULT_DAYS,
  DEFAULT_DAYS_2,
  DEFAULT_FEATURE_COLOR,
  DEFAULT_GALA_COLOR,
  DEFAULT_PX_PER_MIN,
  DEFAULT_SEED,
  DEFAULT_SHORT_COLOR,
  cloneDays,
  mk,
  uid
} from './lib/defaults';
import { exportCsv, exportPdf } from './lib/export';
import { colorOf, findSession, fmt, place } from './lib/schedule';
import { clearDraft, loadDraft, saveDraft } from './lib/storage';
import { addSnapshotEntry, loadSnapshotList, type SnapshotEntry } from './lib/snapshots';
import { statesDiffer } from './lib/diff';
import type { Day, Session, SessionType, Snapshot } from './lib/types';
import { useDragResize } from './hooks/useDragResize';
import Header from './components/Header';
import Sidebar, { type DraftSession, type SelectedInfo } from './components/Sidebar';
import ScheduleGrid from './components/ScheduleGrid';
import ConfirmModal from './components/ConfirmModal';

const pad2 = (n: number) => ('0' + n).slice(-2);

interface ComparableFields {
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

function toComparable(x: ComparableFields): ComparableFields {
  return {
    name: x.name,
    days: x.days,
    altDays: x.altDays,
    dayCount: x.dayCount,
    startMin: x.startMin,
    endMin: x.endMin,
    minBreak: x.minBreak,
    breakColor: x.breakColor,
    zoom: x.zoom
  };
}

export default function App() {
  const [dayCount, setDayCount] = useState<2 | 3>(3);
  const [startMin, setStartMin] = useState(11 * 60);
  const [endMin, setEndMin] = useState(23 * 60);
  const [selId, setSelId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const [agendaName, setAgendaName] = useState('Festival Weekend Schedule');
  const [naming, setNaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [importing, setImporting] = useState(false);
  const [importDraft, setImportDraft] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [snapshotNote, setSnapshotNote] = useState<string | null>(null);

  const [minBreak, setMinBreak] = useState<number | null>(null);
  const [breakColor, setBreakColor] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [days, setDays] = useState<Day[]>(() => cloneDays(DEFAULT_DAYS));
  const [altDays, setAltDays] = useState<Day[]>(() => cloneDays(DEFAULT_DAYS_2));
  const [draftSession, setDraftSession] = useState<DraftSession>({ title: '', type: 'feature', duration: 100, dayId: 'sat', color: null });
  const [savedSnapshots, setSavedSnapshots] = useState<SnapshotEntry[]>(() => loadSnapshotList());
  const [pendingOpen, setPendingOpen] = useState<string | null>(null);
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null);
  const [serverBaseline, setServerBaseline] = useState<ComparableFields | null>(null);

  const hydratedRef = useRef(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const urlInputRef = useRef<HTMLInputElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const shareTimerRef = useRef<number | undefined>(undefined);

  const minBreakValue = minBreak ?? 15;
  const breakColorValue = breakColor ?? DEFAULT_BREAK_COLOR;
  const pxPerMin = zoom ?? DEFAULT_PX_PER_MIN;

  // Resolve a (possibly partial) snapshot's fallbacks once, so the object
  // actually applied to state and the object used for dirty-comparison are
  // always identical — cloneDays() mints fresh random ids on every call, so
  // resolving twice independently would make an untouched snapshot look
  // "dirty" the instant it loads.
  function resolveSnapshot(d: Partial<Snapshot>): ComparableFields {
    return {
      name: d.name || '',
      days: d.days!,
      altDays: d.altDays && d.altDays.length ? d.altDays : cloneDays(DEFAULT_DAYS_2),
      dayCount: (d.dayCount as 2 | 3) ?? 3,
      startMin: d.startMin ?? 660,
      endMin: d.endMin ?? 1380,
      minBreak: d.minBreak ?? null,
      breakColor: d.breakColor ?? null,
      zoom: d.zoom ?? null
    };
  }

  function applyResolved(r: ComparableFields, seedValue: string, note: string | null): void {
    setDays(r.days);
    setAltDays(r.altDays);
    setDayCount(r.dayCount);
    setStartMin(r.startMin);
    setEndMin(r.endMin);
    setSeed(seedValue);
    setAgendaName(r.name);
    setZoom(r.zoom);
    setMinBreak(r.minBreak);
    setBreakColor(r.breakColor);
    setSnapshotNote(note || null);
  }

  // Load a server-saved snapshot, but prefer this browser's own unsaved
  // local edits for it when they differ — and flag that they're unsaved.
  function hydrateSnapshot(id: string, serverData: Snapshot, baseNote: string): boolean {
    if (!Array.isArray(serverData?.days)) return false;
    const serverResolved = resolveSnapshot(serverData);
    const local = loadDraft(id);
    if (local && statesDiffer(serverResolved, toComparable(local))) {
      applyResolved(toComparable(local), local.seed, baseNote);
    } else {
      applyResolved(serverResolved, serverData.seed || DEFAULT_SEED, baseNote);
    }
    setServerBaseline(serverResolved);
    setActiveSnapshotId(id);
    return true;
  }

  // Hydrate from a share link, else fall back to the browser's local draft.
  useEffect(() => {
    (async () => {
      const qs = new URLSearchParams(window.location.search).get('s');
      if (qs) {
        try {
          const d = await fetchShare(qs);
          const at = d.at;
          const when = at ? new Date(at) : null;
          if (hydrateSnapshot(qs, d, when ? 'Shared snapshot · ' + when.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Shared snapshot')) {
            hydratedRef.current = true;
            return;
          }
        } catch {
          /* fall through to local draft */
        }
      }
      const draft = loadDraft(null);
      if (draft) {
        setSeed(draft.seed);
        setAgendaName(draft.name || '');
        setDays(draft.days);
        setAltDays(draft.altDays && draft.altDays.length ? draft.altDays : cloneDays(DEFAULT_DAYS_2));
        setDayCount(draft.dayCount);
        setStartMin(draft.startMin);
        setEndMin(draft.endMin);
        setMinBreak(draft.minBreak ?? null);
        setBreakColor(draft.breakColor ?? null);
        setZoom(draft.zoom ?? null);
      }
      hydratedRef.current = true;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave the working draft locally once hydrated, scoped to whichever
  // snapshot (or the id-less scratch copy) is currently active.
  useEffect(() => {
    if (!hydratedRef.current || !seed) return;
    saveDraft(activeSnapshotId, { seed, name: agendaName, days, altDays, dayCount, startMin, endMin, minBreak, breakColor, zoom });
  }, [activeSnapshotId, seed, agendaName, days, altDays, dayCount, startMin, endMin, minBreak, breakColor, zoom]);

  // Whether the live state has diverged from the last known server-saved
  // version of the currently active snapshot.
  const isDirty = useMemo(() => {
    if (!serverBaseline) return false;
    return statesDiffer(serverBaseline, toComparable({ name: agendaName, days, altDays, dayCount, startMin, endMin, minBreak, breakColor, zoom }));
  }, [serverBaseline, agendaName, days, altDays, dayCount, startMin, endMin, minBreak, breakColor, zoom]);
  const displayedSnapshotNote = snapshotNote ? snapshotNote + (isDirty ? ' · changes not saved yet' : '') : null;

  // Backspace/Delete removes the selected session; Escape deselects.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'Backspace' || e.key === 'Delete') && selId) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        const id = selId;
        setSelId(null);
        setDays((cur) => cur.map((d) => ({ ...d, sessions: d.sessions.filter((x) => x.id !== id) })));
      } else if (e.key === 'Escape') {
        setSelId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selId]);

  // Clicking outside a session block or the sidebar deselects.
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (!selId) return;
      const t = e.target as HTMLElement;
      if (t && t.closest && (t.closest('[data-block]') || t.closest('[data-keep-selection]'))) return;
      setSelId(null);
    };
    window.addEventListener('pointerdown', handler, true);
    return () => window.removeEventListener('pointerdown', handler, true);
  }, [selId]);

  const { registerCol, startDrag, startResize } = useDragResize(days, setDays, startMin, minBreakValue, pxPerMin, setSelId, setDragId);

  const selFound = useMemo(() => findSession(days, selId), [days, selId]);
  const selectedInfo: SelectedInfo | null = useMemo(() => {
    if (!selFound) return null;
    const resolvedColor = colorOf(selFound.session, DEFAULT_FEATURE_COLOR, DEFAULT_SHORT_COLOR, DEFAULT_GALA_COLOR);
    const row = place(selFound.day.sessions, startMin, minBreakValue).rows.find((r) => r.session.id === selFound.session.id);
    return {
      title: selFound.session.title,
      duration: selFound.session.duration,
      type: selFound.session.type,
      color: selFound.session.color,
      resolvedColor,
      timeLabel: row ? fmt(row.start) + ' – ' + fmt(row.end) + ' · ' + selFound.day.label : ''
    };
  }, [selFound, startMin, minBreakValue]);

  const colors = { feature: DEFAULT_FEATURE_COLOR, short: DEFAULT_SHORT_COLOR, gala: DEFAULT_GALA_COLOR, breakColor: breakColorValue };
  const dayViews = days.map((d) => buildDayView(d, startMin, endMin, minBreakValue, pxPerMin, selId, dragId, colors));

  const patchSession = (id: string | null, patch: Partial<Session>) => {
    if (!id) return;
    setDays((cur) => cur.map((d) => ({ ...d, sessions: d.sessions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })));
  };

  const onDeselect = () => setSelId(null);
  const onDelete = () => {
    const id = selId;
    setSelId(null);
    setDays((cur) => cur.map((d) => ({ ...d, sessions: d.sessions.filter((x) => x.id !== id) })));
  };
  const onDuplicate = () => {
    if (!selFound) return;
    const copy = { ...selFound.session, id: uid() };
    setDays((cur) =>
      cur.map((d) => {
        if (d.id !== selFound.day.id) return d;
        const list = d.sessions.slice();
        list.splice(
          list.findIndex((x) => x.id === selFound.session.id) + 1,
          0,
          copy
        );
        return { ...d, sessions: list };
      })
    );
    setSelId(copy.id);
  };

  const onAdd = () => {
    const dayId = draftSession.dayId;
    const day = days.find((d) => d.id === dayId) || days[0];
    const s = mk(draftSession.title.trim() || (draftSession.type === 'feature' ? 'Untitled feature' : 'Untitled shorts block'), draftSession.type, draftSession.duration, draftSession.color);
    setDays((cur) => cur.map((d) => (d.id === day.id ? { ...d, sessions: d.sessions.concat([s]) } : d)));
    setDraftSession((d) => ({ ...d, title: '' }));
  };

  const onDayCountChange = (n: 2 | 3) => {
    if (n === dayCount) return;
    setDayCount(n);
    setSelId(null);
    setDays(altDays);
    setAltDays(days);
    setDraftSession((d) => ({ ...d, dayId: 'sat' }));
  };

  const onStartChange = (v: string) => {
    const [h, m] = v.split(':').map(Number);
    if (!isNaN(h)) setStartMin(Math.min(h * 60 + (m || 0), endMin - 60));
  };
  const onEndChange = (v: string) => {
    const [h, m] = v.split(':').map(Number);
    if (!isNaN(h)) setEndMin(Math.max(h * 60 + (m || 0), startMin + 60));
  };

  const onReset = () => {
    clearDraft(null);
    try {
      const p = new URLSearchParams(window.location.search);
      p.delete('s');
      const q = p.toString();
      window.history.replaceState(null, '', window.location.pathname + (q ? '?' + q : ''));
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  const onOpenSnapshot = (value: string) => {
    if (!value) return;
    setPendingOpen(value);
  };
  const onOpenSnapshotCancel = () => setPendingOpen(null);
  const onOpenSnapshotConfirm = async () => {
    const value = pendingOpen;
    setPendingOpen(null);
    if (!value) return;
    if (value === '__defaults__') {
      onReset();
      return;
    }
    try {
      const d = await fetchShare(value);
      hydrateSnapshot(value, d, 'Opened “' + (d.name || 'snapshot') + '”');
    } catch {
      setSnapshotNote('Could not open that snapshot.');
    }
  };

  const onNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onShare();
    if (e.key === 'Escape') setNaming(false);
  };
  const onNamingCancel = () => {
    setNaming(false);
    setShareUrl(null);
    setImporting(false);
    setImportDraft('');
    setImportError(null);
    setShareError(null);
  };
  const onImportOpen = () => {
    setNaming(true);
    setImporting(true);
    setImportDraft('');
    setImportError(null);
    setTimeout(() => importInputRef.current?.focus(), 40);
  };
  const onImportApply = async () => {
    const raw = (importDraft || '').trim();
    if (!raw) return;
    let code = raw;
    try {
      if (/^https?:/.test(raw)) code = new URL(raw).searchParams.get('s') || raw;
      else if (raw.indexOf('s=') === 0) code = raw.slice(2);
    } catch {
      /* treat as a bare code */
    }
    try {
      const d = await fetchShare(code);
      if (hydrateSnapshot(code, d, 'Imported schedule')) {
        setNaming(false);
        setImporting(false);
        setImportDraft('');
        setImportError(null);
        return;
      }
    } catch {
      /* fall through */
    }
    setImportError('That code could not be read.');
  };
  const onUrlFocus = (e: React.SyntheticEvent<HTMLInputElement>) => e.currentTarget.select();

  const onShare = () => {
    if (!naming) {
      setNaming(true);
      setNameDraft(agendaName || 'Festival Weekend Schedule');
      setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }, 40);
      return;
    }
    void doShare();
  };

  async function doShare() {
    setShareError(null);
    const name = (nameDraft || '').trim() || 'Festival Weekend Schedule';
    const snapshot: Snapshot = {
      v: 2,
      seed: seed || DEFAULT_SEED,
      name,
      days,
      altDays,
      dayCount,
      startMin,
      endMin,
      minBreak,
      breakColor,
      zoom,
      at: Date.now()
    };

    let finalUrl: string;
    try {
      const id = await createShare(snapshot);
      setSavedSnapshots(addSnapshotEntry({ id, name, at: snapshot.at }));
      setActiveSnapshotId(id);
      setServerBaseline(toComparable(snapshot));
      setSnapshotNote('Saved snapshot');
      const url = new URL(window.location.href);
      url.searchParams.set('s', id);
      url.hash = '';
      finalUrl = url.toString();
      window.history.replaceState(null, '', url.pathname + url.search);
    } catch {
      setShareError('Could not save this agenda — try again.');
      return;
    }

    const done = (msg: string) => {
      setShareNote(msg);
      window.clearTimeout(shareTimerRef.current);
      shareTimerRef.current = window.setTimeout(() => setShareNote(null), 2600);
    };
    const legacyCopy = () => {
      try {
        const ta = document.createElement('textarea');
        ta.value = finalUrl;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, finalUrl.length);
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    };
    const reveal = () => {
      setAgendaName(name);
      setNaming(true);
      setShareUrl(finalUrl);
      setShareNote(null);
      setTimeout(() => {
        urlInputRef.current?.focus();
        urlInputRef.current?.select();
      }, 40);
    };
    const succeed = () => {
      setAgendaName(name);
      setNaming(false);
      setShareUrl(null);
      done('Copied');
    };

    if (legacyCopy()) {
      succeed();
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(finalUrl);
        succeed();
      } catch {
        reveal();
      }
    } else {
      reveal();
    }
  }

  const rangeLabel = (dayCount === 3 ? 'Friday – Sunday' : 'Saturday – Sunday') + '  ·  ' + fmt(startMin) + ' – ' + fmt(endMin) + '  ·  ' + minBreakValue + ' min minimum break';
  const shareAction = importing ? 'Close' : shareUrl ? 'Copy share link' : naming ? 'Copy link' : shareNote || 'Copy share link';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        agendaName={agendaName}
        onNameChange={setAgendaName}
        rangeLabel={rangeLabel}
        snapshotNote={displayedSnapshotNote}
        dayCount={dayCount}
        onDayCountChange={onDayCountChange}
        startValue={pad2(Math.floor(startMin / 60)) + ':' + pad2(startMin % 60)}
        endValue={pad2(Math.floor(endMin / 60)) + ':' + pad2(endMin % 60)}
        onStartChange={onStartChange}
        onEndChange={onEndChange}
        minBreakValue={minBreakValue}
        onMinBreakChange={setMinBreak}
        breakColorValue={breakColorValue}
        onBreakColorChange={setBreakColor}
        zoomValue={pxPerMin}
        zoomLabel={Math.round((pxPerMin / DEFAULT_PX_PER_MIN) * 100) + '%'}
        onZoomChange={setZoom}
        onExportPdf={() => exportPdf(days, startMin, endMin, minBreakValue, agendaName, dayCount)}
        onExportCsv={() => exportCsv(days, startMin, minBreakValue, agendaName)}
        savedSnapshots={savedSnapshots}
        onOpenSnapshot={onOpenSnapshot}
        naming={naming}
        nameDraft={nameDraft}
        onNameDraft={setNameDraft}
        onNameKeyDown={onNameKeyDown}
        nameRef={(el) => (nameInputRef.current = el)}
        onNamingCancel={onNamingCancel}
        shareUrl={!importing ? shareUrl : null}
        urlRef={(el) => (urlInputRef.current = el)}
        onUrlFocus={onUrlFocus}
        importing={importing}
        importDraft={importDraft}
        onImportDraft={setImportDraft}
        importRef={(el) => (importInputRef.current = el)}
        importError={importError}
        onImportOpen={onImportOpen}
        onImportApply={() => void onImportApply()}
        onShare={onShare}
        shareAction={shareAction}
        shareError={shareError}
      />

      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'stretch' }}>
        <Sidebar
          selected={selectedInfo}
          onSelTitle={(v) => patchSession(selId, { title: v })}
          onSelDuration={(v) => patchSession(selId, { duration: v })}
          onSelType={(v: SessionType) => patchSession(selId, { type: v })}
          onSelColor={(v) => patchSession(selId, { color: v })}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onDeselect={onDeselect}
          draft={draftSession}
          dayOptions={days.map((d) => ({ id: d.id, label: d.label }))}
          onDraftTitle={(v) => setDraftSession((d) => ({ ...d, title: v }))}
          onDraftDuration={(v) => setDraftSession((d) => ({ ...d, duration: v }))}
          onDraftDay={(v) => setDraftSession((d) => ({ ...d, dayId: v }))}
          onDraftType={(v: SessionType) => setDraftSession((d) => ({ ...d, type: v }))}
          onDraftColor={(v) => setDraftSession((d) => ({ ...d, color: v }))}
          onAdd={onAdd}
          minBreakValue={minBreakValue}
        />
        <ScheduleGrid
          startMin={startMin}
          endMin={endMin}
          pxPerMin={pxPerMin}
          dayViews={dayViews}
          registerCol={registerCol}
          onDown={startDrag}
          onResize={startResize}
        />
      </div>

      <ConfirmModal
        open={pendingOpen !== null}
        message="Are you sure? Make sure you save your current snapshot before opening another one."
        onConfirm={() => void onOpenSnapshotConfirm()}
        onCancel={onOpenSnapshotCancel}
      />
    </div>
  );
}
