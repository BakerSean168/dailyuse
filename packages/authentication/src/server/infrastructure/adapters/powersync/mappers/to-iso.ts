/**
 * Residual 981: sole toIso helper for PowerSync auth mappers.
 * Auth identity + session mappers import this; local duals retired.
 * Converts epoch-ms timestamps to ISO strings; null/undefined → null.
 */

export function toIso(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return new Date(value).toISOString();
}
