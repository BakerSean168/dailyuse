import { padTwoDigits } from './pad-two-digits';

/**
 * Residual 1252: sole formatDateToYMD — Date → YYYY-MM-DD local calendar string.
 * Dual-retired from CreateScheduleDialog + task TimeConfig/Reminder/Recurrence sections.
 * Residual 1318: padStart dual retired onto padTwoDigits sole (YMD join stays local).
 * Soft residual 1249: formatDisplayDate sole remains separate (display vs storage encoding).
 */
export function formatDateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = padTwoDigits(date.getMonth() + 1);
  const d = padTwoDigits(date.getDate());
  return `${y}-${m}-${d}`;
}
