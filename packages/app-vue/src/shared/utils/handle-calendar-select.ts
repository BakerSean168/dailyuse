import { formatDateToYMD } from './format-date-to-ymd';

/**
 * Residual 1258: sole handleCalendarSelect — Calendar value → YYYY-MM-DD via setter.
 * Accepts Date or date-fns-like { toDate() }; else setter('').
 * Dual-retired from CreateScheduleDialog + TimeConfigSection.
 * Soft residual 1258: Recurrence handleEndDateCalendarSelect / Reminder inline select differ (no force-merge).
 * Soft residual 1252: formatDateToYMD sole remains separate.
 */
export function handleCalendarSelect(
  date: unknown,
  setter: (value: string) => void,
): void {
  if (date instanceof Date) {
    setter(formatDateToYMD(date));
  } else if (date && typeof date === 'object' && 'toDate' in date) {
    setter(formatDateToYMD((date as { toDate: () => Date }).toDate()));
  } else {
    setter('');
  }
}
