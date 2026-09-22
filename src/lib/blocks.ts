import { FESTIVAL_DATE_LABELS, INTRO, TYPES } from './defaults';
import { colorOf, fmt, place, tint } from './schedule';
import type { Day } from './types';

export interface BlockView {
  kind: 'session' | 'gap';
  id: string;
  sessionId: string;
  top: number;
  h: number;
  z: number;
  bg: string;
  bar: string;
  barW: number;
  borderStyle: string;
  borderCol: string;
  shadow: string;
  cursor: string;
  outerPad: string;
  title: string;
  titleFont: string;
  titleSize: number;
  titleWeight: number;
  titleCol: string;
  lineH: number;
  sub: string;
  introH: number;
  introTint: string;
  introLabel: string;
  showIntro: boolean;
  showMeta: boolean;
  showTitle: boolean;
  pad: string;
}

export interface PaletteColors {
  feature: string;
  short: string;
  gala: string;
  breakColor: string;
}

export interface DayView {
  id: string;
  label: string;
  date: string;
  blocks: BlockView[];
  stat: string;
  overrun: string | null;
}

export function buildDayView(
  day: Day,
  startMin: number,
  endMin: number,
  minBreak: number,
  ppm: number,
  selId: string | null,
  dragId: string | null,
  colors: PaletteColors
): DayView {
  const { rows, end } = place(day.sessions, startMin, minBreak);
  const blocks: BlockView[] = [];

  rows.forEach((r) => {
    const s = r.session;
    const col = colorOf(s, colors.feature, colors.short, colors.gala);
    const h = (s.duration + INTRO) * ppm;
    const isSel = s.id === selId;
    const isDrag = s.id === dragId;

    blocks.push({
      kind: 'session',
      id: s.id,
      sessionId: s.id,
      top: (r.start - startMin) * ppm,
      h,
      z: isDrag ? 30 : 2,
      bg: tint(col, isDrag ? 0.26 : 0.16),
      bar: col,
      barW: 4,
      borderStyle: 'solid',
      borderCol: tint(col, 0.5),
      shadow: isDrag ? '0 10px 26px -8px rgba(61,46,31,0.3)' : isSel ? '0 0 0 2px #B8552E' : '0 1px 2px rgba(61,46,31,0.06)',
      cursor: isDrag ? 'grabbing' : 'grab',
      outerPad: '1.5px 0',
      title: s.title,
      titleFont: "'Newsreader',Georgia,serif",
      titleSize: 15,
      titleWeight: 500,
      titleCol: '#2A2520',
      lineH: 1.2,
      sub: fmt(r.filmStart) + ' – ' + fmt(r.end) + ' · ' + s.duration + ' min',
      introH: Math.max(13, INTRO * ppm + 4),
      introTint: tint(col, 0.34),
      introLabel: fmt(r.start) + ' · intro ' + INTRO + ' min',
      showIntro: h >= 30,
      showMeta: h >= 42,
      showTitle: h >= 20,
      pad: h >= 24 ? '5px 9px' : '0 9px'
    });

    if (r.gap) {
      const gh = Math.max(r.gap.dur * ppm, 17);
      const bc = colors.breakColor;
      const tight = gh < 26;
      blocks.push({
        kind: 'gap',
        id: s.id + '-gap',
        sessionId: r.gap.owner.id,
        top: (r.gap.start - startMin) * ppm,
        h: gh,
        z: 1,
        bg: tint(bc, 0.1),
        bar: 'transparent',
        barW: 0,
        borderStyle: 'dashed',
        borderCol: tint(bc, 0.55),
        shadow: 'none',
        cursor: 'default',
        outerPad: tight ? '0' : '1.5px 0',
        title: 'Break · ' + r.gap.dur + ' min',
        titleFont: "'IBM Plex Mono',monospace",
        titleSize: tight ? 9 : 10.5,
        titleWeight: 400,
        titleCol: '#5B4A3A',
        lineH: tight ? 1 : 1.2,
        sub: fmt(r.gap.start) + ' – ' + fmt(r.gap.start + r.gap.dur),
        introH: 0,
        introTint: 'transparent',
        introLabel: '',
        showIntro: false,
        showMeta: gh >= 42,
        showTitle: true,
        pad: tight ? '0 7px' : '5px 9px'
      });
    }
  });

  const total = day.sessions.reduce((a, s) => a + s.duration, 0);
  const totalLabel = (m: number) => {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return (h ? h + 'h ' : '') + (mm ? mm + 'm' : h ? '' : '0m');
  };

  return {
    id: day.id,
    label: day.label,
    date: FESTIVAL_DATE_LABELS[day.id] || '',
    blocks,
    stat: day.sessions.length + (day.sessions.length === 1 ? ' film · ' : ' films · ') + totalLabel(total),
    overrun: end > endMin ? '+' + Math.round(end - endMin) + ' min over' : null
  };
}

export function typeLabel(typeId: string): string {
  return (TYPES.find((t) => t.id === typeId) || TYPES[0]).label;
}
