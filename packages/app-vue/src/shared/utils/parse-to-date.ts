/**
 * Residual 1255: sole parseToDate — YYYY-MM-DD → local Date (T00:00:00).
 * Empty → undefined. Dual-retired from CreateScheduleDialog parseToDate +
 * TimeConfigSection parseInputToDate.
 * Soft residual 1249/1252: formatDisplayDate / formatDateToYMD soles remain separate.
 */
export function parseToDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  return new Date(dateStr + 'T00:00:00');
}
