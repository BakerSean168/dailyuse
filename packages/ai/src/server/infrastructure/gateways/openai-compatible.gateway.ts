import type {
  OpenAICompatibleCompletionRequest,
  OpenAICompatibleCompletionResponse,
  OpenAICompatibleCompletionResult,
} from './types';
import {
  extractOpenAICompatibleMessageContent,
  normalizeOpenAICompatibleBaseUrl,
  normalizeOpenAICompatibleMaxTokens,
  normalizeOpenAICompatibleModelId,
} from '../../shared/openai-compatible-normalize';

export {
  OPENAI_COMPATIBLE_MIN_MAX_TOKENS,
  extractOpenAICompatibleMessageContent,
  normalizeOpenAICompatibleBaseUrl,
  normalizeOpenAICompatibleMaxTokens,
  normalizeOpenAICompatibleModelId,
} from '../../shared/openai-compatible-normalize';

export class OpenAICompatibleGateway {
  async complete(
    request: OpenAICompatibleCompletionRequest,
  ): Promise<OpenAICompatibleCompletionResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(buildCompletionUrl(request.baseUrl), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${request.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: normalizeOpenAICompatibleModelId(request.model),
          messages: request.messages,
          temperature: request.temperature ?? 0.3,
          ...(request.maxTokens != null
            ? { max_tokens: normalizeOpenAICompatibleMaxTokens(request.maxTokens) }
            : {}),
          ...(request.responseFormat === 'json'
            ? { response_format: { type: 'json_object' } }
            : {}),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Provider request failed: ${response.status} ${await response.text()}`);
      }

      const json = (await response.json()) as OpenAICompatibleCompletionResponse;
      const choice = json?.choices?.[0];
      const content = extractOpenAICompatibleMessageContent(choice?.message?.content);
      const finishReason = choice?.finish_reason ?? undefined;

      if (!content) {
        const reason = finishReason ? ` (finish_reason=${finishReason})` : '';
        throw new Error(`Provider returned empty content${reason}`);
      }

      return {
        content,
        model: json?.model ? normalizeOpenAICompatibleModelId(json.model) : undefined,
        finishReason,
        usage: {
          promptTokens: json?.usage?.prompt_tokens ?? 0,
          completionTokens: json?.usage?.completion_tokens ?? 0,
          totalTokens: json?.usage?.total_tokens ?? 0,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Provider request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

function buildCompletionUrl(baseUrl: string): string {
  return new URL('chat/completions', normalizeOpenAICompatibleBaseUrl(baseUrl)).toString();
}
