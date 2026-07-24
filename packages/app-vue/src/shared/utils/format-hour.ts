import { padTwoDigits } from './pad-two-digits';

/**
 * Residual 1276: sole formatHour — hour number → local "HH:00".
 * Dual-retired from DayViewCalendar + WeekViewCalendar.
 * Residual 1318: padStart dual retired onto padTwoDigits sole (:00 join stays local).
 * Soft residual 1276 / Residual 1279: formatEventTime keep-boundary (Day " - " vs Week "-") remains separate.
 * Soft residual 1273: formatCalendarEventTimeRange dual-retired sole remains separate (en-dash event ranges).
 */
export function formatHour(hour: number): string {
  return `${padTwoDigits(hour)}:00`;
}
