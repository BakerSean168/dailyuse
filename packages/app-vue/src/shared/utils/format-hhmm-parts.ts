/**
 * Residual 1297: sole formatHHmmParts — hour+minute numbers → HH:mm (padStart).
 * Dual-retired from TaskCapsulePreview / DailyTodoWidget minutes-of-day fmt,
 * task-template-presentation formatMinuteOfDay pad body, and TaskInstanceCard timeLabel.
 * Soft residual: formatLocalHHmm (ms timestamp) remains separate sole; formatHour (:00);
 * Day/Week formatEventTime separator keep-boundary; dashboard/goal multi-site formatTime.
 */
export function formatHHmmParts(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
