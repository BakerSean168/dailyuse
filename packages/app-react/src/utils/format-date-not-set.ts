/**
 * Residual 1261: sole formatDateNotSet — session product-time + empty catalog notSet.
 */
import { formatProductDate, emptyKind } from './product-time';

export function formatDateNotSet(timestamp: number | null): string {
  return formatProductDate(timestamp, emptyKind('notSet'));
}
