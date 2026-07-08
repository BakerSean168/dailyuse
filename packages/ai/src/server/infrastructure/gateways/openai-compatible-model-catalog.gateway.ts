import type { AIModelInfo } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils/logger';
import type {
  IAIProviderModelCatalogPort,
  ProviderModelCatalogInput,
} from '../../application/ports';

interface OpenAICompatibleModelsResponse {
  data?: Array<{
    id?: string;
    name?: string;
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
      const detail = await response.text();
      throw new Error(
        `Failed to load provider models (${response.status}) ${detail.trim() || 'unknown error'}`,
      );
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
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return new URL('models', normalizedBaseUrl).toString();
}

function normalizeModel(row: OpenAICompatibleModelRow): AIModelInfo | null {
  const id = row.id?.trim();
  if (!id || EXCLUDED_MODEL_PATTERNS.some((pattern) => pattern.test(id))) {
    return null;
  }

  return {
    id,
    name: row.name?.trim() || id,
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
