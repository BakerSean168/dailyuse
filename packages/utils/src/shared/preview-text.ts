/**
 * Residual 1011: sole previewText helper elevated from packages/ai (residual 995)
 * and apps/api backend-automation dual.
 * Collapses whitespace, trims, and truncates with "..." when over maxLength.
 * Default maxLength is 240; call sites may pass 200/220 to preserve prior behavior.
 */

export function previewText(
  value: string | null | undefined,
  maxLength = 240,
): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 3)}...`;
}
