/**
 * Residual 1294: sole formatLocalHHmm — ms timestamp → local HH:mm (padStart).
 * Dual-retired from schedule formatCapsuleTime body, ReminderCapsulePreview formatTime,
 * and UpcomingRemindersWidget formatReminderTime HH:mm branch (null guard stays local).
 * Soft residual 1237: dashboard/goal multi-site formatTime keep-boundaries remain separate
 * (relative i18n / date-fns absolute / toLocaleString — no force-merge).
 */
export function formatLocalHHmm(ms: number): string {
  const date = new Date(ms);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
