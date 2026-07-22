/**
 * CustomModelGateway — production Model Gateway for OpenAI-compatible endpoints (ADR-035).
 *
 * Residual 337: IModelGatewayPort implementation wrapping OpenAICompatibleGateway +
 * OpenAICompatibleModelCatalogGateway. Completions/catalog only — never mutation tools,
 * never silent engine.* offers, never puts apiKey on results or events.
 */
import type {
  IModelGatewayPort,
  ModelGatewayCompleteInput,
  ModelGatewayCompleteResult,
  ModelGatewayDescriptor,
  ModelGatewayModelInfo,
} from '@dailyuse/contracts/ai';
import { OpenAICompatibleGateway } from '../gateways/openai-compatible.gateway';
import { OpenAICompatibleModelCatalogGateway } from '../gateways/openai-compatible-model-catalog.gateway';

export const CUSTOM_MODEL_GATEWAY_ID = 'model.openai_compatible' as const;

const DESCRIPTOR: ModelGatewayDescriptor = {
  gatewayId: CUSTOM_MODEL_GATEWAY_ID,
  kind: 'openai_compatible',
  placement: 'server',
  credentialsInEvents: false,
};

export class CustomModelGateway implements IModelGatewayPort {
  readonly descriptor: ModelGatewayDescriptor = DESCRIPTOR;

  constructor(
    private readonly completion: OpenAICompatibleGateway = new OpenAICompatibleGateway(),
    private readonly catalog: OpenAICompatibleModelCatalogGateway = new OpenAICompatibleModelCatalogGateway(),
  ) {}

  async listModels(
    auth: { baseUrl: string; apiKey: string },
  ): Promise<ModelGatewayModelInfo[]> {
    const models = await this.catalog.listModels({
      baseUrl: auth.baseUrl,
      apiKey: auth.apiKey,
    });
    return models.map((model) => ({
      id: model.id,
      name: model.name,
      description: model.description,
      contextWindow: model.contextWindow,
    }));
  }

  async complete(input: ModelGatewayCompleteInput): Promise<ModelGatewayCompleteResult> {
    const result = await this.completion.complete({
      baseUrl: input.auth.baseUrl,
      apiKey: input.auth.apiKey,
      model: input.model,
      messages: input.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      temperature: input.temperature,
      maxTokens: input.maxTokens,
      responseFormat: input.responseFormat,
    });

    // Never echo apiKey — only bindingId for audit correlation.
    return {
      content: result.content,
      model: result.model,
      finishReason: result.finishReason,
      usage: result.usage,
      modelBindingId: input.auth.bindingId,
    };
  }

  async *stream(
    input: ModelGatewayCompleteInput,
  ): AsyncGenerator<{ content: string; finishReason?: string }, void, void> {
    const result = await this.complete(input);
    yield {
      content: result.content,
      finishReason: result.finishReason,
    };
  }
}
