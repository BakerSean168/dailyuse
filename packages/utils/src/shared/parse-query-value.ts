/**
 * Residual 989: sole Express query value parsers for notification + reminder routes.
 * parseString prefers first array entry / stringifies scalars; parseNumber uses it.
 * Soft residual: schedule route parsers remain keep-boundary (empty-string / boolean shapes differ).
 * Soft residual: goal parseBoolean sole (residual 985) is true/false-only, not this dual body.
 */

export function parseString(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return value.length > 0 ? String(value[0]) : undefined;
  }
  if (value === undefined || value === null) {
    return undefined;
  }
  return String(value);
}

export function parseNumber(value: unknown): number | undefined {
  const raw = parseString(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}
