/**
 * Residual 1312: sole padTwoDigits — non-negative integer → two-digit padStart string.
 * Dual-retired from TimeConfigSection / ReminderSection / CreateScheduleDialog
 * hour/minute option lists and time-part pads.
 * Soft residual: ScheduleFormDemo datetime-local YMD+HH:mm composition; formatHHmmParts
 * may compose this sole (Residual 1297 lock still owns HH:mm join).
 */
export function padTwoDigits(n: number): string {
  return String(n).padStart(2, '0');
}
