import type { Result } from '@memoflow/contracts/result';
import { ok } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import {
  AIProviderType,
  type AIProviderConfigServerDTO,
  type CreateAIProviderConfigReq,
  type AIProviderConfigClientDTO,
} from '@memoflow/contracts/ai';
import { createLogger } from '@memoflow/utils/logger';
import { AiProviderConfigId } from '../../../domain/value-objects/ai-provider-config-id';
import type { IAIProviderConfigRepository } from '../../../domain/repositories/i-ai-provider-config-repository';
import { toClientDTO } from './ai-provider-config-helpers';
import { normalizeOpenAICompatibleModelId } from '../../../shared/openai-compatible-normalize';

const logger = createLogger('CreateAIProviderUseCase');

export class CreateAIProviderUseCase {
  constructor(private readonly providerConfigRepository: IAIProviderConfigRepository) {}

  async execute(
    request: CreateAIProviderConfigReq,
    cx: ExecutionContext,
  ): Promise<Result<AIProviderConfigClientDTO>> {
    if (request.isDefault) {
      await this.providerConfigRepository.clearDefaultForIdentity(cx.identityId);
    }

    const now = Date.now();
    const provider: AIProviderConfigServerDTO = {
      id: AiProviderConfigId.generate(),
      identityId: cx.identityId as AIProviderConfigServerDTO['identityId'],
      name: request.name.trim(),
      providerType: AIProviderType.OpenAICompatible,
      baseUrl: request.baseUrl.replace(/\/+$/, ''),
      apiKey: request.apiKey,
      defaultModel: normalizeOpenAICompatibleModelId(request.model),
      availableModels: [],
      isActive: true,
      isDefault: request.isDefault ?? false,
      priority: 100,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await this.providerConfigRepository.save(provider);
    logger.info('AI provider created', { identityId: cx.identityId, providerId: provider.id });
    return ok(toClientDTO(provider));
  }
}



