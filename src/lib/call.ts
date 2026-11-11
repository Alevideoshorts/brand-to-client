import type { Settings } from './types';

const TZ = 'Europe/Rome';
/** Per quanto tempo dopo l'inizio la call risulta "in corso". */
const LIVE_WINDOW = 2 * 60 * 60 * 1000;

export const WEEKDAYS = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'];

const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

/** Data e ora "da orologio" a Roma per un istante. */
function romeParts(t: number) {
  const p: Record<string, number> = {};
  fmt.formatToParts(new Date(t)).forEach((x) => {
    if (x.type !== 'literal') p[x.type] = Number(x.value);
  });
  return { y: p.year, m: p.month, d: p.day, h: p.hour, mi: p.minute };
}

/** Istante corrispondente a un'ora "da orologio" a Roma. */
function romeWallToUtc(y: number, m: number, d: number, h: number, mi: number): number {
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const r = romeParts(guess);
  const offset = Date.UTC(r.y, r.m - 1, r.d, r.h, r.mi) - guess;
  return guess - offset;
}

export interface StudentCalls {
  configured: boolean;
  /** Call incluse nel periodo dello studente. */
  total: number;
  /** Call ancora da fare (compresa quella in corso). */
  remaining: number;
  /** Numero della prossima call (1-based). */
  number: number;
  next: Date | null;
  live: boolean;
  finished: boolean;
  /** Fine del periodo di call dello studente. */
  until: Date | null;
  months: number;
  weekdayLabel: string;
  time: string;
}

/**
 * Call settimanali di uno studente: una a settimana (giorno e ora fissi, ora italiana)
 * per N mesi a partire dal giorno in cui è stato sbloccato.
 */
export function studentCalls(settings: Settings, startIso: string | null | undefined, now = Date.now()): StudentCalls {
  const weekday = parseInt(settings.call_weekday, 10);
  const months = Math.max(1, parseInt(settings.call_months, 10) || 3);
  const [hh, mm] = (settings.call_time || '').split(':').map((x) => parseInt(x, 10));
  const base = { months, weekdayLabel: WEEKDAYS[(weekday || 1) - 1] ?? '', time: settings.call_time };
  const start = startIso ? new Date(startIso).getTime() : NaN;
  if (!(weekday >= 1 && weekday <= 7) || Number.isNaN(hh) || Number.isNaN(mm) || Number.isNaN(start)) {
    return { ...base, configured: false, total: 0, remaining: 0, number: 0, next: null, live: false, finished: false, until: null };
  }
  const s = romeParts(start);
  const until = romeWallToUtc(s.y, s.m + months, s.d, s.h, s.mi);
  const calls: number[] = [];
  for (let i = 0; i < months * 31 + 7; i++) {
    const day = new Date(Date.UTC(s.y, s.m - 1, s.d + i));
    const wd = ((day.getUTCDay() + 6) % 7) + 1; // 1 = lunedì
    if (wd !== weekday) continue;
    const t = romeWallToUtc(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), hh, mm);
    if (t >= start && t < until) calls.push(t);
    if (t >= until) break;
  }
  const upcoming = calls.filter((t) => t + LIVE_WINDOW > now);
  const next = upcoming[0] ?? null;
  return {
    ...base,
    configured: true,
    total: calls.length,
    remaining: upcoming.length,
    number: next ? calls.indexOf(next) + 1 : calls.length,
    next: next ? new Date(next) : null,
    live: next !== null && now >= next,
    finished: upcoming.length === 0,
    until: new Date(until),
  };
}

export function formatCallDate(d: Date): string {
  const day = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ });
  const time = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${time}`;
}

export function formatDay(d: Date): string {
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ });
}

export function splitCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const two = (n: number) => String(n).padStart(2, '0');
  return { d: two(Math.floor(s / 86400)), h: two(Math.floor((s % 86400) / 3600)), m: two(Math.floor((s % 3600) / 60)), s: two(s % 60) };
}
