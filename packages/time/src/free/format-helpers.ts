/**
 * Free-function format helpers (ADR-037).
 * Thin wrappers over defaultTime.format — stable signatures for app-vue soles
 * and form helpers. Style-aware empty display: prefer createTimeFacade().format.*.
 */
import { defaultTime } from '../facade';

export function padTwoDigits(n: number): string {
  return defaultTime.format.padTwoDigits(n);
}

/** ms timestamp → local HH:mm (empty override → '') */
export function formatLocalHHmm(ms: number): string {
  return defaultTime.format.localHHmm(ms, { empty: { display: '' } });
}

/** Date → YYYY-MM-DD local calendar string */
export function formatDateToYMD(date: Date): string {
  return defaultTime.format.dateToYmd(date);
}

/** hour+minute → HH:mm */
export function formatHHmmParts(hour: number, minute: number): string {
  return defaultTime.format.hhmmParts(hour, minute);
}

/** hour → HH:00 */
export function formatHour(hour: number): string {
  return defaultTime.format.hourLabel(hour);
}

/** YYYY-MM-DD → locale short month/day display */
export function formatDisplayDate(dateStr: string, locale: string): string {
  if (!dateStr) return '';
  return defaultTime.withStyle({ locale }).format.ymdDisplay(dateStr, {
    empty: { display: '' },
  });
}
