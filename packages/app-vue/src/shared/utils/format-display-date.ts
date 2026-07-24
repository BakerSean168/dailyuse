/**
 * Residual 1249: sole formatDisplayDate — YYYY-MM-DD → locale short month/day display.
 * Empty → ''; parse as local calendar day via T00:00:00 (avoid UTC shift).
 * Dual-retired from schedule CreateScheduleDialog + task TimeConfig/Reminder/Recurrence sections.
 */
export function formatDisplayDate(dateStr: string, locale: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
