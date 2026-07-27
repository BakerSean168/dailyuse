/**
 * Residual 1261: sole formatDateNotSet — session product-time + empty catalog notSet.
 * Accepts Instant (epoch ms), Ymd / date string, or null.
 */
import { formatProductDate, emptyKind } from './product-time';

export function formatDateNotSet(value: number | string | null | undefined): string {
  if (value == null || value === '') {
    return emptyKind('notSet');
  }
  return formatProductDate(value, emptyKind('notSet'));
}
