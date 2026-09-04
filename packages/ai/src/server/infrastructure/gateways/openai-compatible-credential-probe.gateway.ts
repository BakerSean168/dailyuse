import { AIExecutionError } from '../../../shared/ai-execution-error';
import type {
  IAIProviderCredentialProbePort,
  ProviderCredentialProbeInput,
} from '../../application/ports/provider-credential-probe.port';
import { normalizeOpenAICompatibleBaseUrl } from '../../shared/openai-compatible-normalize';

const PROBE_TIMEOUT_MS = 15_000;

export class OpenAICompatibleCredentialProbeGateway implements IAIProviderCredentialProbePort {
  async validate(input: ProviderCredentialProbeInput): Promise<void> {
    if (input.strategy !== 'openrouter_key') return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      const url = new URL('key', normalizeOpenAICompatibleBaseUrl(input.baseUrl)).toString();
      const response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${input.apiKey}` },
        redirect: 'manual',
        signal: controller.signal,
      });
      if (response.status >= 300 && response.status < 400) {
        throw new AIExecutionError('transport', 'AI provider credential probe redirected unexpectedly', {
          statusCode: response.status,
        });
      }
      if (!response.ok) {
        await response.text();
        throw new AIExecutionError(mapStatus(response.status), 'AI provider credential validation failed', {
          statusCode: response.status,
        });
      }
      await response.text();
    } catch (error) {
      if (error instanceof AIExecutionError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIExecutionError('timeout', 'AI provider credential probe timed out', { cause: error });
      }
      throw new AIExecutionError('transport', 'AI provider credential probe failed', { cause: error });
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

function mapStatus(status: number): import('../../../shared/ai-execution-error').AIExecutionErrorKind {
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'upstream_provider_error';
  return 'transport';
}
