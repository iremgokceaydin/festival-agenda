import { INTRO, TYPES } from './defaults';
import { fmt, place } from './schedule';
import type { Day } from './types';

interface ExportRow {
  day: Day;
  start: number;
  end: number;
  title: string;
  kind: string;
  dur: number;
  isBreak: boolean;
}

function exportRows(days: Day[], startMin: number, minBreak: number): ExportRow[] {
  const out: ExportRow[] = [];
  days.forEach((day) => {
    const { rows } = place(day.sessions, startMin, minBreak);
    rows.forEach((r) => {
      if (r.gap) out.push({ day, start: r.gap.start, end: r.gap.start + r.gap.dur, title: 'Break', kind: 'Break', dur: r.gap.dur, isBreak: true });
      const t = TYPES.find((x) => x.id === r.session.type) || TYPES[0];
      out.push({ day, start: r.start, end: r.end, title: r.session.title, kind: t.label, dur: r.session.duration + INTRO, isBreak: false });
    });
  });
  return out;
}

export function exportCsv(days: Day[], startMin: number, minBreak: number, agendaName: string): void {
  const q = (v: unknown) => '"' + String(v).replace(/"/g, '""') + '"';
  const lines = [['Day', 'Date', 'Start', 'End', 'Title', 'Kind', 'Minutes'].join(',')];
  exportRows(days, startMin, minBreak).forEach((r) => {
    lines.push([q(r.day.label), q(r.day.date), q(fmt(r.start)), q(fmt(r.end)), q(r.title), q(r.kind), r.dur].join(','));
  });
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = ((agendaName || 'festival weekend schedule').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'schedule') + '.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
}

export function exportPdf(days: Day[], startMin: number, endMin: number, minBreak: number, agendaName: string, dayCount: 2 | 3): void {
  const esc = (s: unknown) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const byDay: Record<string, { day: Day; rows: ExportRow[] }> = {};
  exportRows(days, startMin, minBreak).forEach((r) => {
    (byDay[r.day.id] = byDay[r.day.id] || { day: r.day, rows: [] }).rows.push(r);
  });
  const durLabel = (m: number) => {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return (h ? h + 'h ' : '') + (mm ? mm + 'm' : h ? '' : '0m');
  };
  const sections = Object.keys(byDay)
    .map((k) => {
      const g = byDay[k];
      const total = g.rows.filter((r) => !r.isBreak).reduce((a, r) => a + r.dur, 0);
      const body = g.rows
        .map(
          (r) =>
            '<tr class="' +
            (r.isBreak ? 'brk' : '') +
            '"><td class="t">' +
            fmt(r.start) +
            ' – ' +
            fmt(r.end) +
            '</td><td>' +
            esc(r.title) +
            '</td><td class="k">' +
            (r.isBreak ? '' : esc(r.kind)) +
            '</td><td class="d">' +
            r.dur +
            ' min</td></tr>'
        )
        .join('');
      return (
        '<section><h2>' +
        esc(g.day.label) +
        ' <span class="date">' +
        esc(g.day.date) +
        '</span></h2>' +
        '<p class="meta">' +
        g.rows.filter((r) => !r.isBreak).length +
        ' films · ' +
        durLabel(total) +
        ' on screen</p>' +
        '<table>' +
        body +
        '</table></section>'
      );
    })
    .join('');

  const doc =
    '<!doctype html><html><head><meta charset="utf-8"><title>Festival Weekend Schedule</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500&family=IBM+Plex+Mono:wght@400&family=IBM+Plex+Sans:wght@400;600&display=swap" rel="stylesheet">' +
    '<style>@page{margin:18mm}body{margin:0;background:#fff;color:#2A2520;font-family:"IBM Plex Sans",sans-serif;font-size:11pt}' +
    'h1{font-family:"Newsreader",Georgia,serif;font-weight:500;font-size:26pt;margin:0;color:#3D2E1F}' +
    '.sub{font-family:"IBM Plex Mono",monospace;font-size:9pt;color:#8A7D6D;margin:4pt 0 18pt}' +
    'section{break-inside:avoid;margin-bottom:20pt}' +
    'h2{font-family:"Newsreader",Georgia,serif;font-weight:500;font-size:16pt;margin:0;color:#3D2E1F;border-bottom:1px solid #E6DDD0;padding-bottom:4pt}' +
    'h2 .date{font-family:"IBM Plex Mono",monospace;font-size:9pt;color:#AFA594}' +
    '.meta{font-family:"IBM Plex Mono",monospace;font-size:8.5pt;color:#8A7D6D;margin:5pt 0 8pt}' +
    'table{width:100%;border-collapse:collapse}td{padding:5pt 6pt;border-bottom:1px solid #EFE8DB;vertical-align:baseline}' +
    'td.t{font-family:"IBM Plex Mono",monospace;font-size:9pt;color:#5B4A3A;white-space:nowrap;width:26%}' +
    'td.k{font-size:9pt;color:#6B6056;width:24%}td.d{font-family:"IBM Plex Mono",monospace;font-size:9pt;color:#8A7D6D;text-align:right;white-space:nowrap;width:14%}' +
    'tr.brk td{color:#8A7D6D;font-family:"IBM Plex Mono",monospace;font-size:8.5pt}</style></head><body>' +
    '<h1>' +
    esc(agendaName || 'Festival Weekend Schedule') +
    '</h1><p class="sub">' +
    esc((dayCount === 3 ? 'Friday – Sunday' : 'Saturday – Sunday') + ' · ' + fmt(startMin) + ' – ' + fmt(endMin) + ' · ' + minBreak + ' min minimum break') +
    '</p>' +
    sections +
    '</body></html>';

  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;';
  frame.srcdoc = doc;
  frame.onload = () => {
    setTimeout(() => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch {
        const w = window.open('', '_blank');
        if (w) {
          w.document.write(doc);
          w.document.close();
          w.focus();
          w.print();
        }
      }
      setTimeout(() => frame.remove(), 2000);
    }, 400);
  };
  document.body.appendChild(frame);
}
