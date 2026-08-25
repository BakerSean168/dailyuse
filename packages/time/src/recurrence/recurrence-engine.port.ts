import type { Hm, Instant, Ymd } from '../types';
import type { TimeZoneId } from '../types';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RecurrenceWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * MemoFlow-owned recurrence input. No RRULE/ICAL implementation type is allowed here.
 * Dates/times remain ADR-037 product primitives.
 */
export interface RecurrenceSchedule {
  startDate: Ymd;
  localTime: Hm;
  timeZone: TimeZoneId;
  frequency: RecurrenceFrequency;
  interval: number;
  /** Sunday=0 ... Saturday=6. Used by weekly recurrence. */
  byWeekday: readonly RecurrenceWeekday[];
  /** RFC-style finite recurrence count. */
  count: number | null;
  /** Inclusive absolute boundary. */
  until: Instant | null;
}

export interface RecurrenceRange {
  from: Instant;
  to: Instant;
  inclusive?: boolean;
}

export interface RecurrenceEnginePort {
  between(schedule: RecurrenceSchedule, range: RecurrenceRange): Instant[];
  next(schedule: RecurrenceSchedule, after: Instant, inclusive?: boolean): Instant | null;
}
