import type ExcelJS from 'exceljs';
import { FESTIVAL_DATE_LABELS, INTRO, TYPES } from './defaults';
import { fmt, place } from './schedule';
import type { Day, SessionType } from './types';

interface ExportRow {
  day: Day;
  start: number;
  end: number;
  title: string;
  kind: string;
  type: SessionType | null;
  dur: number;
  isBreak: boolean;
}

function exportRows(days: Day[], startMin: number, minBreak: number): ExportRow[] {
  const out: ExportRow[] = [];
  days.forEach((day) => {
    const { rows } = place(day.sessions, startMin, minBreak);
    rows.forEach((r) => {
      if (r.gap) out.push({ day, start: r.gap.start, end: r.gap.start + r.gap.dur, title: 'Break', kind: 'Break', type: null, dur: r.gap.dur, isBreak: true });
      const t = TYPES.find((x) => x.id === r.session.type) || TYPES[0];
      out.push({ day, start: r.start, end: r.end, title: r.session.title, kind: t.label, type: r.session.type, dur: r.session.duration + INTRO, isBreak: false });
    });
  });
  return out;
}

const FILM_ROW_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3B0' } };
const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6DDD0' } };

export async function exportXlsx(days: Day[], startMin: number, minBreak: number, agendaName: string): Promise<void> {
  // Dynamically imported so the ~1MB exceljs bundle only loads when someone
  // actually clicks the button, not on every page visit.
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Schedule');
  ws.columns = [
    { header: 'Day', key: 'day', width: 12 },
    { header: 'Date', key: 'date', width: 10 },
    { header: 'Start', key: 'start', width: 11 },
    { header: 'End', key: 'end', width: 11 },
    { header: 'Title', key: 'title', width: 36 },
    { header: 'Kind', key: 'kind', width: 26 },
    { header: 'Minutes', key: 'minutes', width: 10 }
  ];
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => (cell.fill = HEADER_FILL));

  exportRows(days, startMin, minBreak).forEach((r) => {
    const row = ws.addRow({
      day: r.day.label,
      date: FESTIVAL_DATE_LABELS[r.day.id] || '',
      start: fmt(r.start),
      end: fmt(r.end),
      title: r.title,
      kind: r.isBreak ? '' : r.kind,
      minutes: r.dur
    });
    // Feature and short film rows get a light yellow background; breaks stay plain.
    if (!r.isBreak) row.eachCell((cell) => (cell.fill = FILM_ROW_FILL));
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = ((agendaName || 'festival weekend schedule').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'schedule') + '.xlsx';
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
      const featureCount = g.rows.filter((r) => r.type === 'feature').length;
      const shortCount = g.rows.filter((r) => r.type === 'fiction' || r.type === 'doc').length;
      const countParts: string[] = [];
      if (featureCount) countParts.push(featureCount + (featureCount === 1 ? ' feature' : ' features'));
      if (shortCount) countParts.push(shortCount + (shortCount === 1 ? ' short' : ' shorts'));
      const countLabel = countParts.length ? countParts.join(', ') : '0 films';
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
        esc(FESTIVAL_DATE_LABELS[g.day.id] || '') +
        '</span></h2>' +
        '<p class="meta">' +
        countLabel +
        ' · ' +
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
