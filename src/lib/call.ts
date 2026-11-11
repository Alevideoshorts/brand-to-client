import type { Settings } from './types';

const WEEK = 7 * 24 * 60 * 60 * 1000;
/** Per quanto tempo dopo l'inizio la call risulta "in corso". */
const LIVE_WINDOW = 2 * 60 * 60 * 1000;

export interface CallInfo {
  configured: boolean;
  /** Numero della prossima call (1-based). */
  number: number;
  total: number;
  /** Data della prossima call (o di quella in corso). */
  at: Date | null;
  live: boolean;
  finished: boolean;
}

/** Calcola la prossima call settimanale partendo dalla prima call e dal numero totale. */
export function nextCall(settings: Settings, now = Date.now()): CallInfo {
  const total = Math.max(1, parseInt(settings.call_count, 10) || 8);
  const first = settings.call_first_at ? new Date(settings.call_first_at).getTime() : NaN;
  if (Number.isNaN(first)) return { configured: false, number: 0, total, at: null, live: false, finished: false };
  for (let i = 0; i < total; i++) {
    const start = first + i * WEEK;
    if (now < start + LIVE_WINDOW) {
      return { configured: true, number: i + 1, total, at: new Date(start), live: now >= start, finished: false };
    }
  }
  return { configured: true, number: total, total, at: null, live: false, finished: true };
}

const TZ = 'Europe/Rome';

export function formatCallDate(d: Date): string {
  const day = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ });
  const time = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${time}`;
}

export function splitCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const two = (n: number) => String(n).padStart(2, '0');
  return { d: two(Math.floor(s / 86400)), h: two(Math.floor((s % 86400) / 3600)), m: two(Math.floor((s % 3600) / 60)), s: two(s % 60) };
}

/** Converte una data ISO nel formato richiesto da <input type="datetime-local"> (ora italiana). */
export function isoToLocalInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);
  return parts.replace(' ', 'T');
}

/** Converte il valore di <input type="datetime-local"> (inteso come ora italiana) in ISO. */
export function localInputToIso(value: string): string {
  if (!value) return '';
  const [date, time] = value.split('T');
  const [y, mo, da] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  // Trova l'offset di Roma per quella data.
  const guess = Date.UTC(y, mo - 1, da, h, mi);
  const asRome = new Date(new Date(guess).toLocaleString('en-US', { timeZone: TZ }));
  const asUtc = new Date(new Date(guess).toLocaleString('en-US', { timeZone: 'UTC' }));
  const offset = asRome.getTime() - asUtc.getTime();
  return new Date(guess - offset).toISOString();
}
