/**
 * Residual 995: sole previewText helper for AI goal/chat observability previews.
 * generate-ai-goal use case + goal automation/planning adapters + internal client import this;
 * local duals retired.
 * Collapses whitespace, trims, and truncates with "..." when over maxLength.
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
