import type { AIModelInfo } from '@memoflow/contracts/ai';
import { createLogger } from '@memoflow/utils/logger';
import { AIExecutionError } from '../../../shared/ai-execution-error';
import type {
  IAIProviderModelCatalogPort,
  ProviderModelCatalogInput,
} from '../../application/ports';
import {
  normalizeOpenAICompatibleBaseUrl,
  normalizeOpenAICompatibleModelId,
} from '../../shared/openai-compatible-normalize';

interface OpenAICompatibleModelsResponse {
  data?: Array<{
    id?: string;
    name?: string;
    /** Google AI Studio / Gemini OpenAI-compatible catalog uses display_name. */
    display_name?: string;
    description?: string;
    context_window?: number;
    context_length?: number;
    pricing?: {
      prompt?: string | number;
      completion?: string | number;
    };
  }>;
}

type OpenAICompatibleModelRow = NonNullable<OpenAICompatibleModelsResponse['data']>[number];

const EXCLUDED_MODEL_PATTERNS = [
  /embedding/i,
  /whisper/i,
  /transcrib/i,
  /tts/i,
  /moderation/i,
  /dall-e/i,
  /image/i,
  /vision-preview/i,
];

const logger = createLogger('OpenAICompatibleModelCatalogGateway');

export class OpenAICompatibleModelCatalogGateway implements IAIProviderModelCatalogPort {
  async listModels(input: ProviderModelCatalogInput): Promise<AIModelInfo[]> {
    const modelsUrl = buildModelsUrl(input.baseUrl);
    logger.info('Loading provider model catalog', {
      baseUrl: input.baseUrl,
      modelsUrl,
    });

    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      await response.text();
      const category =
        response.status === 401 || response.status === 403
          ? 'unauthorized'
          : response.status === 429
            ? 'rate_limited'
            : response.status >= 500
              ? 'upstream_provider_error'
              : 'transport';
      throw new AIExecutionError(category, 'Failed to load provider models', {
        statusCode: response.status,
      });
    }

    const payload = (await response.json()) as OpenAICompatibleModelsResponse;
    const rows = Array.isArray(payload.data) ? payload.data : [];

    const models = rows
      .map((row) => normalizeModel(row))
      .filter((row): row is AIModelInfo => Boolean(row))
      .sort((left, right) => left.name.localeCompare(right.name));

    logger.info('Provider model catalog loaded', {
      baseUrl: input.baseUrl,
      modelCount: models.length,
      sampleModelIds: models.slice(0, 10).map((model) => model.id),
    });

    return models;
  }
}

function buildModelsUrl(baseUrl: string): string {
  return new URL('models', normalizeOpenAICompatibleBaseUrl(baseUrl)).toString();
}

function normalizeModel(row: OpenAICompatibleModelRow): AIModelInfo | null {
  const rawId = row.id?.trim();
  if (!rawId || EXCLUDED_MODEL_PATTERNS.some((pattern) => pattern.test(rawId))) {
    return null;
  }

  // Gemini catalog IDs often look like "models/gemini-2.0-flash"; strip for chat/completions.
  const id = normalizeOpenAICompatibleModelId(rawId);
  if (!id || EXCLUDED_MODEL_PATTERNS.some((pattern) => pattern.test(id))) {
    return null;
  }

  const displayName = row.display_name?.trim() || row.name?.trim() || id;

  return {
    id,
    name: displayName,
    description: row.description?.trim() || undefined,
    contextWindow: normalizeNumber(row.context_window ?? row.context_length),
    inputCostPer1M: normalizePrice(row.pricing?.prompt),
    outputCostPer1M: normalizePrice(row.pricing?.completion),
  };
}

function normalizeNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizePrice(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}
