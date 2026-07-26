/**
 * Residual 1324: sole formatScheduleDurationMinutes — total minutes → schedule.duration.* i18n.
 * P4: arithmetic via @dailyuse/time splitDurationMinutes; L4 only picks i18n dictionary.
 * Soft residual 1243: ConflictAlert ms floor / task graph concatenative / formatTaskDuration Intl / AI formatDurationMs.
 */
import { splitDurationMinutes } from '@dailyuse/time';

export type ScheduleDurationTranslate = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export function formatScheduleDurationMinutes(
  minutes: number,
  t: ScheduleDurationTranslate,
): string {
  const { hours, minutes: mins } = splitDurationMinutes(minutes);
  if (hours === 0) {
    return t('schedule.duration.minutes', { n: mins });
  }
  return mins > 0
    ? t('schedule.duration.hoursMinutes', { h: hours, m: mins })
    : t('schedule.duration.hours', { h: hours });
}
