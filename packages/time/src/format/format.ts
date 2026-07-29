import type { Instant, Ymd } from '@memoflow/contracts/primitives';
import type {
  Clock,
  PartialTimeStyle,
  TimeDisplaySlot,
  TimeEngine,
  TimeStyle,
} from '../types';
import { mergeTimeStyle } from '../style/default-style';
import { isFiniteInstantMs } from '../codec/brand';
import {
  splitDurationMs,
  splitDurationMinutes,
  formatDurationParts,
  type DurationParts,
} from './duration';

export interface FormatApi {
  hm(instant: Instant | number | null | undefined, styleOverride?: PartialTimeStyle): string;
  date(instant: Instant | number | null | undefined, styleOverride?: PartialTimeStyle): string;
  dateTime(instant: Instant | number | null | undefined, styleOverride?: PartialTimeStyle): string;
  /** Absolute `yyyy-MM-dd HH:mm:ss` (common detail timestamps). */
  dateTimeSeconds(
    instant: Instant | number | null | undefined,
    styleOverride?: PartialTimeStyle,
  ): string;
  ymdDisplay(ymd: Ymd | string | null | undefined, styleOverride?: PartialTimeStyle): string;
  relative(
    instant: Instant | number | null | undefined,
    styleOverride?: PartialTimeStyle,
  ): string;
  /**
   * Named product patterns via engine (date-fns tokens). Prefer hm/date/dateTime;
   * use pattern only when a fixed chart/export token is required.
   */
  pattern(
    instant: Instant | number | null | undefined,
    pattern: string,
    styleOverride?: PartialTimeStyle,
  ): string;
  /** Named calendar chrome slot (P6) — Style.display.period* patterns. */
  slot(
    name: TimeDisplaySlot,
    instant: Instant | number | null | undefined,
    styleOverride?: PartialTimeStyle,
  ): string;
  /** Duration from milliseconds (P4) — arithmetic sole; optional L4 dictionary labels. */
  durationMs(
    ms: number | null | undefined,
    options?: {
      labels?: { hours?: (n: number) => string; minutes?: (n: number) => string; seconds?: (n: number) => string; join?: string };
      styleOverride?: PartialTimeStyle;
    },
  ): string;
  /** Duration from total minutes (P4). */
  durationMinutes(
    minutes: number | null | undefined,
    options?: {
      labels?: { hours?: (n: number) => string; minutes?: (n: number) => string; join?: string };
      styleOverride?: PartialTimeStyle;
    },
  ): string;
  /** Split helpers for L4 dictionaries. */
  splitDurationMs(ms: number): DurationParts;
  splitDurationMinutes(totalMinutes: number): DurationParts;
  /** Lifted from app-vue sole: local HH:mm from epoch ms */
  localHHmm(ms: number | null | undefined, styleOverride?: PartialTimeStyle): string;
  /** Lifted: Date → YYYY-MM-DD local */
  dateToYmd(date: Date | null | undefined, styleOverride?: PartialTimeStyle): string;
  /** Lifted: hour+minute → HH:mm */
  hhmmParts(hour: number, minute: number): string;
  /** Lifted: hour → HH:00 */
  hourLabel(hour: number): string;
  padTwoDigits(n: number): string;
}

function resolveStyle(base: TimeStyle, override?: PartialTimeStyle): TimeStyle {
  return mergeTimeStyle(base, override);
}

function emptyOr(
  value: Instant | number | null | undefined,
  style: TimeStyle,
): Instant | null {
  if (value == null || !isFiniteInstantMs(value)) {
    return null;
  }
  return value as Instant;
}

export function createFormat(
  style: TimeStyle,
  engine: TimeEngine,
  clock: Clock,
): FormatApi {
  return {
    hm(instant, styleOverride) {
      const s = resolveStyle(style, styleOverride);
      const i = emptyOr(instant, s);
      if (i == null) return s.empty.display;
      return engine.formatHm(i, s.display.hm);
    },

    date(instant, styleOverride) {
      const s = resolveStyle(style, styleOverride);
      const i = emptyOr(instant, s);
      if (i == null) return s.empty.display;
      return engine.formatDate(i, s.locale, s.display.date);
    },

    dateTime(instant, styleOverride) {
      const s = resolveStyle(style, styleOverride);
      const i = emptyOr(instant, s);
      if (i == null) return s.empty.display;
      return engine.formatDateTime(i, s.locale, s.display.dateTime);
    },

    dateTimeSeconds(instant, styleOverride) {
      const s = resolveStyle(style, styleOverride);
      const i = emptyOr(instant, s);
      if (i == null) return s.empty.display;
      return engine.formatPattern(i, 'yyyy-MM-dd HH:mm:ss');
    },

    pattern(instant, pattern, styleOverride) {
      const s = resolveStyle(style, styleOverride);
      const i = emptyOr(instant, s);
      if (i == null) return s.empty.display;
      return engine.formatPattern(i, pattern);
    },

    slot(name, instant, styleOverride) {
      const s = resolveStyle(style, styleOverride);
      const i = emptyOr(instant, s);
      if (i == null) return s.empty.display;
      const pattern = s.display[name];
      return engine.formatPattern(i, pattern);
    },

    durationMs(ms, options) {
      const s = resolveStyle(style, options?.styleOverride);
      if (ms == null || !Number.isFinite(ms)) return s.duration.zero;
      const parts = splitDurationMs(ms);
      return formatDurationParts(parts, s, options?.labels);
    },

    durationMinutes(minutes, options) {
      const s = resolveStyle(style, options?.styleOverride);
      if (minutes == null || !Number.isFinite(minutes)) return s.duration.zero;
      const parts = splitDurationMinutes(minutes);
      return formatDurationParts(parts, s, options?.labels);
    },

    splitDurationMs(ms) {
      return splitDurationMs(ms);
    },

    splitDurationMinutes(totalMinutes) {
      return splitDurationMinutes(totalMinutes);
    },

    ymdDisplay(ymd, styleOverride) {
      const s = resolveStyle(style, styleOverride);
      if (ymd == null || ymd === '') return s.empty.display;
      // Local calendar day — avoid UTC shift via T00:00:00.
      const d = new Date(`${ymd}T00:00:00`);
      if (Number.isNaN(d.getTime())) return s.empty.unknown;
      try {
        return d.toLocaleDateString(s.locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch {
        return String(ymd);
      }
    },

    relative(instant, styleOverride) {
      const s = resolveStyle(style, styleOverride);
      const i = emptyOr(instant, s);
      if (i == null) return s.empty.display;
      if (!s.relative.enabled) {
        return engine.formatDateTime(i, s.locale, s.display.dateTime);
      }
      const now = clock.now();
      const delta = now - i;
      if (Math.abs(delta) > s.relative.maxAgeMs) {
        return engine.formatDateTime(i, s.locale, s.display.dateTime);
      }
      try {
        const rtf = new Intl.RelativeTimeFormat(s.locale, {
          numeric: s.relative.numeric,
        });
        const abs = Math.abs(delta);
        const minutes = Math.round(delta / 60_000);
        if (abs < 60_000) return rtf.format(-Math.round(delta / 1000), 'second');
        if (abs < 3_600_000) return rtf.format(-minutes, 'minute');
        if (abs < 86_400_000) return rtf.format(-Math.round(delta / 3_600_000), 'hour');
        return rtf.format(-Math.round(delta / 86_400_000), 'day');
      } catch {
        return engine.formatDateTime(i, s.locale, s.display.dateTime);
      }
    },

    localHHmm(ms, styleOverride) {
      return this.hm(ms, styleOverride);
    },

    dateToYmd(date, styleOverride) {
      const s = resolveStyle(style, styleOverride);
      if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
        return s.empty.input;
      }
      const y = date.getFullYear();
      const m = engine.padTwoDigits(date.getMonth() + 1);
      const d = engine.padTwoDigits(date.getDate());
      return `${y}-${m}-${d}`;
    },

    hhmmParts(hour, minute) {
      return `${engine.padTwoDigits(hour)}:${engine.padTwoDigits(minute)}`;
    },

    hourLabel(hour) {
      return `${engine.padTwoDigits(hour)}:00`;
    },

    padTwoDigits(n) {
      return engine.padTwoDigits(n);
    },
  };
}
