/**
 * Residual 999 / Residual 1019: sole errorMessage helper for AI runtime, app-vue local vault,
 * and database CLI scripts (toErrorMessage alias import).
 * Residual 1127: persistence extractErrorMessage dual retired onto this sole (withCause).
 * Coerces unknown errors to a human-readable message string.
 */

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
