/**
 * Residual 953: sole createAgentId helper for AI workflow composables.
 * Goal / knowledge-note / knowledge-qa / task workflows import this; local duals retired.
 * Policy: prefer crypto.randomUUID; fallback Date.now + Math.random (task previously used
 * a weaker timestamp-only form — unified onto this stronger sole).
 */

/** Build a prefixed agent run/thread id with crypto UUID when available. */
export function createAgentId(prefix: string): string {
  const randomId =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${randomId}`;
}
