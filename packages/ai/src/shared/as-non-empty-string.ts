/**
 * Residual 1121: sole asNonEmptyString helper for AI Host/runtime input binding.
 * host-task-create-start + host-task-create-resume + ai-runtime import this; local duals retired.
 * Non-empty trimmed string only → undefined otherwise (no String() coerce, no null).
 * Soft residual 1117: goal-planning toNonEmptyString remains chat-parse keep-boundary co-located
 * (same trim shape; not force-merged into portable schedule optionalString null+String coerce).
 */

export function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}
