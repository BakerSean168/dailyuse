/**
 * Residual 1009: sole readNestedNumber helper for API/Desktop automation executors.
 * Walks a dotted object path of string segments; missing/non-number leaves return 0.
 */

export function readNestedNumber(source: unknown, path: readonly string[]): number {
  let current = source;

  for (const segment of path) {
    if (!current || typeof current !== 'object' || !(segment in current)) {
      return 0;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === 'number' ? current : 0;
}
