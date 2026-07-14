/**
 * Pure OpenAI-compatible request/response normalizers shared by application and gateways.
 * Google AI Studio / Gemini often emit catalog ids like `models/<id>` and may return
 * multipartite message content arrays on the OpenAI-compatible surface.
 */

export const OPENAI_COMPATIBLE_MIN_MAX_TOKENS = 64;

export function normalizeOpenAICompatibleModelId(model: string): string {
  return model.trim().replace(/^models\//, '');
}

/**
 * Keep a practical floor so Gemini OpenAI-compatible does not truncate to empty content.
 */
export function normalizeOpenAICompatibleMaxTokens(maxTokens: number): number {
  if (!Number.isFinite(maxTokens)) {
    return OPENAI_COMPATIBLE_MIN_MAX_TOKENS;
  }
  return Math.max(Math.trunc(maxTokens), OPENAI_COMPATIBLE_MIN_MAX_TOKENS);
}

/**
 * Normalize OpenAI-compatible message content which may be a string or array of parts.
 * Returns null when the payload is empty after trimming.
 */
export function extractOpenAICompatibleMessageContent(content: unknown): string | null {
  if (typeof content === 'string') {
    const trimmed = content.trim();
    return trimmed.length > 0 ? content : null;
  }

  if (Array.isArray(content)) {
    const text = content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part) {
          const textPart = (part as { text?: unknown }).text;
          return typeof textPart === 'string' ? textPart : '';
        }
        return '';
      })
      .join('');
    const trimmed = text.trim();
    return trimmed.length > 0 ? text : null;
  }

  return null;
}

/**
 * Ensure base URLs used with `new URL(relative, base)` end with a single slash.
 */
export function normalizeOpenAICompatibleBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  return `${trimmed}/`;
}
