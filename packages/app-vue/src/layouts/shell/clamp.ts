/**
 * Residual 1001: sole clamp helper for app-vue shell layout geometry + store widths.
 * When max < min, returns min (fail-safe for inverted ranges).
 */

export function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.max(min, Math.min(max, value));
}
