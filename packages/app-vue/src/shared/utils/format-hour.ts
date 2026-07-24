/**
 * Residual 1276: sole formatHour — hour number → local "HH:00" (padStart).
 * Dual-retired from DayViewCalendar + WeekViewCalendar.
 * Soft residual 1276: formatEventTime Day (" - ") vs Week ("-") separators stay co-located (no force-merge).
 * Soft residual 1273: formatCalendarEventTimeRange dual-retired sole remains separate (en-dash event ranges).
 */
export function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}
