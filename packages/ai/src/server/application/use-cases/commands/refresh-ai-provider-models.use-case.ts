import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import type { RefreshAIProviderModelsRes } from '@memoflow/contracts/ai';
import { createLogger } from '@memoflow/utils/logger';
import type { IAIProviderConfigRepository } from '../../../domain/repositories/i-ai-provider-config-repository';
import type { IAIProviderModelCatalogPort } from '../../ports';

const logger = createLogger('RefreshAIProviderModelsUseCase');

/**
 * Reads the provider's live model inventory using its stored credential.
 *
 * Crucially this does not mutate the Provider aggregate, persist a model list,
 * bump Provider version, or silently replace the user's explicit default model.
 */
export class RefreshAIProviderModelsUseCase {
  constructor(
    private readonly providerConfigRepository: IAIProviderConfigRepository,
    private readonly providerModelCatalogPort: IAIProviderModelCatalogPort,
  ) {}

  async execute(
    providerId: string,
    cx: ExecutionContext,
  ): Promise<Result<RefreshAIProviderModelsRes>> {
    const provider = await this.providerConfigRepository.findByIdForIdentity(
      cx.identityId,
      providerId,
    );
    if (!provider) {
      return error('NOT_FOUND', 'Provider not found');
    }

    logger.info('Reading AI provider model catalog', {
      identityId: cx.identityId,
      providerId,
      baseUrl: provider.baseUrl,
      currentDefaultModel: provider.defaultModel,
    });

    const models = await this.providerModelCatalogPort.listModels({
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
    });
    const fetchedAt = Date.now();

    logger.info('AI provider model catalog loaded', {
      identityId: cx.identityId,
      providerId,
      modelCount: models.length,
    });

    return ok({
      providerId: provider.id,
      models,
      fetchedAt,
    });
  }
}
