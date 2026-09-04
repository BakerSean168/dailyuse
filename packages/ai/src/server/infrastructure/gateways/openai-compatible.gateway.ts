import { AIExecutionError } from '../../../shared/ai-execution-error';
import type { ProviderFetch } from '../security/provider-safe-fetch';
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
  constructor(private readonly fetchImpl: ProviderFetch) {}

  async complete(
    request: OpenAICompatibleCompletionRequest,
  ): Promise<OpenAICompatibleCompletionResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await this.fetchImpl(buildCompletionUrl(request.baseUrl), {
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
        await response.body?.cancel().catch(() => undefined);
        throw new AIExecutionError(
          mapProviderStatus(response.status),
          'AI provider request failed',
          {
            statusCode: response.status,
          },
        );
      }

      const json = (await response.json()) as OpenAICompatibleCompletionResponse;
      const choice = json?.choices?.[0];
      const content = extractOpenAICompatibleMessageContent(choice?.message?.content);
      const finishReason = choice?.finish_reason ?? undefined;

      if (!content) {
        const reason = finishReason ? ` (finish_reason=${finishReason})` : '';
        throw new AIExecutionError('structured_output', `Provider returned empty content${reason}`);
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
      if (error instanceof AIExecutionError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIExecutionError('timeout', 'AI provider request timed out', { cause: error });
      }
      throw new AIExecutionError('transport', 'AI provider transport failed', { cause: error });
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

function buildCompletionUrl(baseUrl: string): string {
  return new URL('chat/completions', normalizeOpenAICompatibleBaseUrl(baseUrl)).toString();
}

function mapProviderStatus(
  status: number,
): import('../../../shared/ai-execution-error').AIExecutionErrorKind {
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 404) return 'model_not_available';
  if (status === 408 || status === 504) return 'timeout';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'upstream_provider_error';
  return 'transport';
}
