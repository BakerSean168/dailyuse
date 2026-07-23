/**
 * Residual 999: sole errorMessage helper for AI runtime + app-vue local vault.
 * Coerces unknown errors to a human-readable message string.
 */

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
