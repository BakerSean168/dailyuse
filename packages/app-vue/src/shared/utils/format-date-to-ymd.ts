/**
 * Residual 1252: sole formatDateToYMD — Date → YYYY-MM-DD local calendar string.
 * Dual-retired from CreateScheduleDialog + task TimeConfig/Reminder/Recurrence sections.
 * Soft residual 1249: formatDisplayDate sole remains separate (display vs storage encoding).
 */
export function formatDateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
