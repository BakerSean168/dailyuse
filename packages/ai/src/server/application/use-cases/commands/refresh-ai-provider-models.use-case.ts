import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import type { AIProviderConfigClientDTO, AIProviderConfigServerDTO } from '@memoflow/contracts/ai';
import { createLogger } from '@memoflow/utils/logger';
import type { IAIProviderConfigRepository } from '../../../domain/repositories/i-ai-provider-config-repository';
import type { IAIProviderModelCatalogPort } from '../../ports';
import { toClientDTO } from './ai-provider-config-helpers';
import { normalizeOpenAICompatibleModelId } from '../../../shared/openai-compatible-normalize';

const logger = createLogger('RefreshAIProviderModelsUseCase');

export class RefreshAIProviderModelsUseCase {
  constructor(
    private readonly providerConfigRepository: IAIProviderConfigRepository,
    private readonly providerModelCatalogPort: IAIProviderModelCatalogPort,
  ) {}

  async execute(
    providerId: string,
    cx: ExecutionContext,
  ): Promise<Result<AIProviderConfigClientDTO>> {
    const provider = await this.providerConfigRepository.findByIdForIdentity(
      cx.identityId,
      providerId,
    );
    if (!provider) {
      return error('NOT_FOUND', 'Provider not found');
    }

    logger.info('Refreshing AI provider models', {
      identityId: cx.identityId,
      providerId,
      baseUrl: provider.baseUrl,
      currentDefaultModel: provider.defaultModel,
    });

    const models = await this.providerModelCatalogPort.listModels({
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
    });

    const updated: AIProviderConfigServerDTO = {
      ...provider,
      availableModels: models,
      defaultModel: (() => {
        const currentDefault = provider.defaultModel
          ? normalizeOpenAICompatibleModelId(provider.defaultModel)
          : null;
        if (currentDefault && models.some((item) => item.id === currentDefault)) {
          return currentDefault;
        }
        return models[0]?.id ?? currentDefault;
      })(),
      updatedAt: Date.now(),
      version: provider.version + 1,
    };

    await this.providerConfigRepository.save(updated);
    logger.info('AI provider models refreshed', {
      identityId: cx.identityId,
      providerId,
      modelCount: models.length,
      nextDefaultModel: updated.defaultModel,
    });
    return ok(toClientDTO(updated));
  }
}



