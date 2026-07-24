/**
 * Soft residual 1243: formatTaskDuration — Intl.NumberFormat unit hour/minute by locale.
 * Shared task util; minutes input; not schedule.presentation durationMs/Sec (no force-merge).
 */
export function formatTaskDuration(totalMinutes: number, locale: string): string {
  const normalizedMinutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  const formatUnit = (value: number, unit: 'hour' | 'minute') =>
    new Intl.NumberFormat(locale, {
      style: 'unit',
      unit,
      unitDisplay: 'short',
      maximumFractionDigits: 0,
    }).format(value);

  if (hours === 0) return formatUnit(minutes, 'minute');
  if (minutes === 0) return formatUnit(hours, 'hour');

  const separator = locale.toLowerCase().startsWith('zh') ? '' : ' ';
  return [formatUnit(hours, 'hour'), formatUnit(minutes, 'minute')].join(separator);
}
