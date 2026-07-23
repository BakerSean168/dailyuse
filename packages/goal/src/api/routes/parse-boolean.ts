/**
 * Residual 985: sole parseBoolean helper for goal API routes.
 * Goal + goal-folder routes import this; local duals retired.
 * Query string "true"/"false" → boolean; otherwise undefined.
 */

export function parseBoolean(value: unknown): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}
