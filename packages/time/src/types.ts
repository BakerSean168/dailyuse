import type { Hm, Instant, TransferDate, Ymd } from '@dailyuse/contracts/primitives';

export type { Instant, TransferDate, Ymd, Hm };

/** Invalid input handling for Codec — never silently substitute Date.now(). */
export type OnInvalid = 'null' | 'throw';

export type LocaleId = string;
export type TimeZoneId = string;

export type TimeZonePolicy = 'local' | TimeZoneId;

export interface TimeStyleCalendar {
  dayBoundary: 'local-midnight';
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export interface TimeStyleEmpty {
  /** Empty / null display for list cells and format.* */
  display: string;
  /** Empty input control value */
  input: string;
  /** Unknown / unparseable display */
  unknown: string;
}

export interface TimeStyleDisplay {
  date: 'short' | 'medium' | 'long';
  dateTime: 'short' | 'medium' | 'long';
  /** Pattern for format.hm — product default HH:mm */
  hm: string;
  /** Named calendar chrome slots (P6) — date-fns patterns */
  periodDay: string;
  periodMonth: string;
  periodWeekDay: string;
  chartMonthDay: string;
}

/** Named display slot keys for format.slot */
export type TimeDisplaySlot =
  | 'periodDay'
  | 'periodMonth'
  | 'periodWeekDay'
  | 'chartMonthDay';

export interface TimeStyleRelative {
  enabled: boolean;
  /** Beyond this age, format.relative falls back to absolute dateTime */
  maxAgeMs: number;
  numeric: 'auto' | 'always';
}

export interface TimeStyleDuration {
  style: 'narrow' | 'long';
  zero: string;
}

/**
 * Product presentation + calendar policy for time.
 * Change empty.display once to affect list empty-time rendering.
 */
export interface TimeStyle {
  locale: LocaleId;
  timeZone: TimeZonePolicy;
  calendar: TimeStyleCalendar;
  empty: TimeStyleEmpty;
  display: TimeStyleDisplay;
  relative: TimeStyleRelative;
  duration: TimeStyleDuration;
}

export type PartialTimeStyle = {
  locale?: LocaleId;
  timeZone?: TimeZonePolicy;
  calendar?: Partial<TimeStyleCalendar>;
  empty?: Partial<TimeStyleEmpty>;
  display?: Partial<TimeStyleDisplay>;
  relative?: Partial<TimeStyleRelative>;
  duration?: Partial<TimeStyleDuration>;
};

export interface Clock {
  now(): Instant;
}

export interface TimeEngine {
  formatHm(instant: Instant, pattern: string): string;
  formatDate(instant: Instant, locale: string, density: TimeStyleDisplay['date']): string;
  formatDateTime(instant: Instant, locale: string, density: TimeStyleDisplay['dateTime']): string;
  /** Arbitrary date-fns-compatible pattern (engine-only; prefer named format.*). */
  formatPattern(instant: Instant, pattern: string): string;
  toYmd(instant: Instant): Ymd;
  fromYmdStart(ymd: Ymd): Instant;
  parseYmd(raw: string): Ymd | null;
  parseHm(raw: string): Hm | null;
  combineYmdHm(ymd: Ymd, hm: Hm): Instant | null;
  startOfDay(instant: Instant): Instant;
  endOfDay(instant: Instant): Instant;
  addDays(instant: Instant, n: number): Instant;
  diffCalendarDays(a: Instant, b: Instant): number;
  diffCalendarWeeks(a: Instant, b: Instant, weekStartsOn?: TimeStyleCalendar['weekStartsOn']): number;
  startOfWeek(instant: Instant, weekStartsOn: TimeStyleCalendar['weekStartsOn']): Instant;
  isSameDay(a: Instant, b: Instant): boolean;
  isValidInstant(instant: Instant | number): boolean;
  padTwoDigits(n: number): string;
}
