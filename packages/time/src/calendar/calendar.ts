import type { Instant, Ymd } from '@dailyuse/contracts/primitives';
import type { Clock, TimeEngine, TimeStyle } from '../types';

export interface CalendarApi {
  startOfDay(instant: Instant | number): Instant;
  endOfDay(instant: Instant | number): Instant;
  addDays(instant: Instant | number, n: number): Instant;
  diffCalendarDays(a: Instant | number, b: Instant | number): number;
  diffCalendarWeeks(a: Instant | number, b: Instant | number): number;
  startOfWeek(instant: Instant | number): Instant;
  toYmd(instant: Instant | number): Ymd;
  isSameDay(a: Instant | number, b: Instant | number): boolean;
  isToday(instant: Instant | number): boolean;
}

export function createCalendar(
  style: TimeStyle,
  engine: TimeEngine,
  clock: Clock,
): CalendarApi {
  const asI = (v: Instant | number): Instant => v as Instant;
  return {
    startOfDay(instant) {
      return engine.startOfDay(asI(instant));
    },
    endOfDay(instant) {
      return engine.endOfDay(asI(instant));
    },
    addDays(instant, n) {
      return engine.addDays(asI(instant), n);
    },
    diffCalendarDays(a, b) {
      return engine.diffCalendarDays(asI(a), asI(b));
    },
    diffCalendarWeeks(a, b) {
      return engine.diffCalendarWeeks(asI(a), asI(b), style.calendar.weekStartsOn);
    },
    startOfWeek(instant) {
      return engine.startOfWeek(asI(instant), style.calendar.weekStartsOn);
    },
    toYmd(instant) {
      return engine.toYmd(asI(instant));
    },
    isSameDay(a, b) {
      return engine.isSameDay(asI(a), asI(b));
    },
    isToday(instant) {
      return engine.isSameDay(asI(instant), clock.now());
    },
  };
}
