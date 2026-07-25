import { padTwoDigits } from './pad-two-digits';

/**
 * Residual 1294: sole formatLocalHHmm — ms timestamp → local HH:mm.
 * Dual-retired from schedule formatCapsuleTime body, ReminderCapsulePreview formatTime,
 * and UpcomingRemindersWidget formatReminderTime HH:mm branch (null guard stays local).
 * Residual 1318: padStart dual retired onto padTwoDigits sole (ms→local contract stays local).
 * Soft residual 1237: dashboard/goal multi-site formatTime keep-boundaries remain separate
 * (relative i18n / date-fns absolute / toLocaleString — no force-merge).
 */
export function formatLocalHHmm(ms: number): string {
  const date = new Date(ms);
  return `${padTwoDigits(date.getHours())}:${padTwoDigits(date.getMinutes())}`;
}
