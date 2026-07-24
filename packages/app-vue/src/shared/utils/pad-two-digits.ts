/**
 * Residual 1312: sole padTwoDigits — non-negative integer → two-digit padStart string.
 * Dual-retired from TimeConfigSection / ReminderSection / CreateScheduleDialog
 * hour/minute option lists and time-part pads.
 * Residual 1315: ScheduleFormDemo datetime-local dual-retired onto formatDateToYMD + formatLocalHHmm.
 * Soft residual: formatHHmmParts/formatLocalHHmm/formatHour/formatDateToYMD may compose this sole
 * (Residual 1297/1294/1276/1252 locks still own their join contracts).
 */
export function padTwoDigits(n: number): string {
  return String(n).padStart(2, '0');
}
