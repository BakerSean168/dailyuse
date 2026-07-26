/**
 * Residual 1264: sole formatDateUnknown — session product-time + empty catalog unknown.
 */
import { formatProductDateTime, emptyKind } from './product-time';

export function formatDateUnknown(value: number | null | undefined): string {
  return formatProductDateTime(value, emptyKind('unknown'));
}
