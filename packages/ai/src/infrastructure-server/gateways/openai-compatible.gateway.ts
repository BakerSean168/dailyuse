import type { OpenAICompatibleCompletionRequest, OpenAICompatibleCompletionResult } from './types';

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
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.3,
          ...(request.responseFormat === 'json'
            ? { response_format: { type: 'json_object' } }
            : {}),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Provider request failed: ${response.status} ${await response.text()}`);
      }

      const json = await response.json();
      const content = json?.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || content.trim().length === 0) {
        throw new Error('Provider returned empty content');
      }

      return {
        content,
        model: json?.model,
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
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return new URL('chat/completions', normalizedBaseUrl).toString();
}
