/**
 * Residual 951: sole plain-object isRecord helper for AI workflow composables.
 * useAIGoalWorkflow + useAIKnowledgeNoteWorkflow import this; local duals retired.
 * Residual 1089 keep-boundary vs desktop http-envelope-guards isRecord (arrays allowed there):
 * this helper rejects arrays and null/falsey values (plain-object only).
 * Soft residual 1139: sanitize-for-ipc isPlainObject (prototype-strict) remains separate (no force-merge).
 */

/** True when value is a non-null plain object (not an array). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
