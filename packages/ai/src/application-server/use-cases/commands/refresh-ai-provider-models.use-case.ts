import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { AIProviderConfigClientDTO, AIProviderConfigServerDTO } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';
import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/i-ai-provider-config-repository';
import type { IAIProviderModelCatalogPort } from '../../ports';
import { toClientDTO } from './ai-provider-config-helpers';

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
    const provider = await this.providerConfigRepository.findById(providerId);
    if (!provider || String(provider.identityId) !== cx.identityId) {
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
      defaultModel:
        provider.defaultModel && models.some((item) => item.id === provider.defaultModel)
          ? provider.defaultModel
          : models[0]?.id ?? provider.defaultModel,
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
