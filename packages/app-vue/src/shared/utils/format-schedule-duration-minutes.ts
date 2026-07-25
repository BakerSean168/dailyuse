/**
 * Residual 1324: sole formatScheduleDurationMinutes — total minutes → schedule.duration.* i18n.
 * Dual-retired from ScheduleConflictAlert + ScheduleFormDemo identical minutes maps.
 * Soft residual: ConflictAlert ms floor (always hoursMinutes when h>0);
 * schedule-presentation durationMs/Sec keep-boundary (Residual 1243);
 * TaskDependencyGraph concatenative; formatTaskDuration Intl; AI formatDurationMs.
 */
export type ScheduleDurationTranslate = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export function formatScheduleDurationMinutes(
  minutes: number,
  t: ScheduleDurationTranslate,
): string {
  if (minutes < 60) {
    return t('schedule.duration.minutes', { n: minutes });
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0
    ? t('schedule.duration.hoursMinutes', { h: hours, m: mins })
    : t('schedule.duration.hours', { h: hours });
}
