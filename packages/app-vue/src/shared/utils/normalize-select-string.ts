/**
 * Converts the broad Reka Select value interface into the string values used by
 * MemoFlow forms. Clearing or receiving a non-string value has one explicit
 * meaning: no selection.
 */
export function normalizeSelectString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}
