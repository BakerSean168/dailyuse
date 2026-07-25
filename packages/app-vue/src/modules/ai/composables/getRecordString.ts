/**
 * Residual 955: sole getRecordString helper for AI workflow composables.
 * useAIGoalWorkflow (was getString) + useAIKnowledgeNoteWorkflow import this; local duals retired.
 * Whitespace-only / empty strings collapse to '' (goal getString empty-check was behaviorally equivalent).
 */

/** Read a trimmed string field from a plain record; non-strings become ''. */
export function getRecordString(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  return typeof value === 'string' ? value.trim() : '';
}
