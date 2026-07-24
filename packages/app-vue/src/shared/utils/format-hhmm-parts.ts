import { padTwoDigits } from './pad-two-digits';

/**
 * Residual 1297: sole formatHHmmParts — hour+minute numbers → HH:mm.
 * Dual-retired from TaskCapsulePreview / DailyTodoWidget minutes-of-day fmt,
 * task-template-presentation formatMinuteOfDay pad body, and TaskInstanceCard timeLabel.
 * Residual 1318: padStart dual retired onto padTwoDigits sole (join contract stays local).
 * Soft residual: formatLocalHHmm (ms timestamp) remains separate sole; formatHour (:00);
 * Day/Week formatEventTime separator keep-boundary; dashboard/goal multi-site formatTime.
 */
export function formatHHmmParts(hour: number, minute: number): string {
  return `${padTwoDigits(hour)}:${padTwoDigits(minute)}`;
}
