/**
 * DateFnsEngine — the **only** product surface that imports date-fns.
 * Business and UI code must use `@dailyuse/time` facade, not date-fns directly.
 */
import {
  addDays as dfAddDays,
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  endOfDay as dfEndOfDay,
  format as dfFormat,
  isSameDay as dfIsSameDay,
  isValid,
  startOfDay as dfStartOfDay,
  startOfWeek as dfStartOfWeek,
} from 'date-fns';
import type { Hm, Instant, Ymd } from '@dailyuse/contracts/primitives';
import type { TimeEngine, TimeStyleCalendar, TimeStyleDisplay } from '../types';
import { asHm, asInstant, asYmd, isHmShape, isYmdShape } from '../codec/brand';

function toDate(instant: Instant): Date {
  return new Date(instant);
}

function densityToDateFnsPattern(density: TimeStyleDisplay['date'] | TimeStyleDisplay['dateTime']): string {
  switch (density) {
    case 'short':
      return 'yyyy/M/d';
    case 'long':
      return 'yyyy年M月d日 HH:mm';
    case 'medium':
    default:
      return 'yyyy-MM-dd HH:mm';
  }
}

function densityToDateOnlyPattern(density: TimeStyleDisplay['date']): string {
  switch (density) {
    case 'short':
      return 'M/d';
    case 'long':
      return 'yyyy年M月d日';
    case 'medium':
    default:
      return 'yyyy-MM-dd';
  }
}


/**
 * Wall-clock Ymd+Hm → Instant under TimeZonePolicy (P11).
 * `local` uses host local calendar; IANA ids use Intl offset fixup (no date-fns-tz).
 */
export function combineYmdHmWithTimeZone(
  ymd: Ymd,
  hm: Hm,
  timeZone: string,
): Instant | null {
  if (!isYmdShape(ymd) || !isHmShape(hm)) return null;
  const [ys, ms, ds] = ymd.split('-');
  const [hs, mins] = hm.split(':');
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  const hour = Number(hs);
  const minute = Number(mins);
  if (![y, m, d, hour, minute].every((n) => Number.isFinite(n))) return null;

  if (timeZone === 'local') {
    const instant = new Date(y, m - 1, d, hour, minute, 0, 0);
    if (!isValid(instant)) return null;
    return asInstant(instant.getTime());
  }

  // Initial guess: treat wall as UTC, then correct by observed TZ offset.
  let utcGuess = Date.UTC(y, m - 1, d, hour, minute, 0, 0);
  for (let i = 0; i < 3; i++) {
    const parts = getZonedParts(utcGuess, timeZone);
    if (parts == null) return null;
    const asUtc = Date.UTC(parts.y, parts.m - 1, parts.d, parts.h, parts.min, 0, 0);
    const desired = Date.UTC(y, m - 1, d, hour, minute, 0, 0);
    const delta = desired - asUtc;
    if (delta === 0) break;
    utcGuess += delta;
  }
  // Verify
  const check = getZonedParts(utcGuess, timeZone);
  if (
    check == null ||
    check.y !== y ||
    check.m !== m ||
    check.d !== d ||
    check.h !== hour ||
    check.min !== minute
  ) {
    // Still return best effort when DST gaps; null only if Intl failed
    if (check == null) return null;
  }
  return asInstant(utcGuess);
}

function getZonedParts(
  utcMs: number,
  timeZone: string,
): { y: number; m: number; d: number; h: number; min: number } | null {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const bag: Record<string, string> = {};
    for (const p of dtf.formatToParts(new Date(utcMs))) {
      if (p.type !== 'literal') bag[p.type] = p.value;
    }
    return {
      y: Number(bag.year),
      m: Number(bag.month),
      d: Number(bag.day),
      h: Number(bag.hour),
      min: Number(bag.minute),
    };
  } catch {
    return null;
  }
}


export function createDateFnsEngine(): TimeEngine {
  return {
    padTwoDigits(n: number): string {
      return String(Math.trunc(n)).padStart(2, '0');
    },

    formatHm(instant: Instant, pattern: string): string {
      const d = toDate(instant);
      if (!isValid(d)) return '';
      // Product default is HH:mm; honor common pattern tokens via date-fns.
      return dfFormat(d, pattern || 'HH:mm');
    },

    formatDate(instant: Instant, _locale: string, density: TimeStyleDisplay['date']): string {
      const d = toDate(instant);
      if (!isValid(d)) return '';
      return dfFormat(d, densityToDateOnlyPattern(density));
    },

    formatDateTime(
      instant: Instant,
      _locale: string,
      density: TimeStyleDisplay['dateTime'],
    ): string {
      const d = toDate(instant);
      if (!isValid(d)) return '';
      return dfFormat(d, densityToDateFnsPattern(density));
    },

    formatPattern(instant: Instant, pattern: string): string {
      const d = toDate(instant);
      if (!isValid(d)) return '';
      return dfFormat(d, pattern);
    },

    toYmd(instant: Instant): Ymd {
      const d = toDate(instant);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return asYmd(`${y}-${m}-${day}`);
    },

    fromYmdStart(ymd: Ymd): Instant {
      const [ys, ms, ds] = ymd.split('-');
      const y = Number(ys);
      const m = Number(ms);
      const d = Number(ds);
      return asInstant(new Date(y, m - 1, d, 0, 0, 0, 0).getTime());
    },

    parseYmd(raw: string): Ymd | null {
      if (!isYmdShape(raw)) return null;
      return asYmd(raw);
    },

    parseHm(raw: string): Hm | null {
      if (!isHmShape(raw)) return null;
      return asHm(raw);
    },

    combineYmdHm(ymd: Ymd, hm: Hm): Instant | null {
      if (!isYmdShape(ymd) || !isHmShape(hm)) return null;
      const [ys, ms, ds] = ymd.split('-');
      const [hs, mins] = hm.split(':');
      const instant = new Date(
        Number(ys),
        Number(ms) - 1,
        Number(ds),
        Number(hs),
        Number(mins),
        0,
        0,
      );
      if (!isValid(instant)) return null;
      return asInstant(instant.getTime());
    },

    startOfDay(instant: Instant): Instant {
      return asInstant(dfStartOfDay(toDate(instant)).getTime());
    },

    endOfDay(instant: Instant): Instant {
      return asInstant(dfEndOfDay(toDate(instant)).getTime());
    },

    addDays(instant: Instant, n: number): Instant {
      return asInstant(dfAddDays(toDate(instant), n).getTime());
    },

    diffCalendarDays(a: Instant, b: Instant): number {
      return differenceInCalendarDays(toDate(a), toDate(b));
    },

    diffCalendarWeeks(
      a: Instant,
      b: Instant,
      weekStartsOn: TimeStyleCalendar['weekStartsOn'] = 1,
    ): number {
      return differenceInCalendarWeeks(toDate(a), toDate(b), { weekStartsOn });
    },

    startOfWeek(instant: Instant, weekStartsOn: TimeStyleCalendar['weekStartsOn']): Instant {
      return asInstant(
        dfStartOfWeek(toDate(instant), { weekStartsOn }).getTime(),
      );
    },

    isSameDay(a: Instant, b: Instant): boolean {
      return dfIsSameDay(toDate(a), toDate(b));
    },

    isValidInstant(instant: Instant | number): boolean {
      return typeof instant === 'number' && Number.isFinite(instant) && isValid(toDate(instant as Instant));
    },
  };
}
