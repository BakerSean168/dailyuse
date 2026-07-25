/**
 * Residual 1312: sole padTwoDigits — non-negative integer → two-digit padStart string.
 * Dual-retired from TimeConfigSection / ReminderSection / CreateScheduleDialog
 * hour/minute option lists and time-part pads.
 * Residual 1315: ScheduleFormDemo datetime-local dual-retired onto formatDateToYMD + formatLocalHHmm.
 * Residual 1318: formatHHmmParts / formatLocalHHmm / formatHour / formatDateToYMD compose this sole
 * (Residual 1297/1294/1276/1252 locks still own their join contracts).
 * Residual 1321: toLocalDateKey Date|number sole composes this sole (key contract stays on Residual 1282).
 * Soft residual: setting/goal multi-site formatTime keep-boundary (relative/date-fns/toLocaleString).
 */
export function padTwoDigits(n: number): string {
  return String(n).padStart(2, '0');
}
