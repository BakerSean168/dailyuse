/**
 * Residual 967: sole isAbortLikeError helper for AI client HTTP SSE adapters.
 * Assistant + message HTTP adapters import this; local duals retired.
 * Soft residual: server ai-chat-helpers and app-vue useAIChatSession keep
 * distinct abort predicates (category/DOMException shapes) — keep-boundary.
 */

export function isAbortLikeError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  if ('name' in error && error.name === 'AbortError') {
    return true;
  }

  if ('message' in error && typeof error.message === 'string') {
    const message = error.message.toLowerCase();
    return message.includes('abort') || message.includes('cancel');
  }

  return false;
}
