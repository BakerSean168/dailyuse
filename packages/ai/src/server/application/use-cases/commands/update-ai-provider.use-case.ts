import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';
import type {
  AIProviderConfigServerDTO,
  UpdateAIProviderConfigReq,
  AIProviderConfigClientDTO,
} from '@memoflow/contracts/ai';
import type { IAIProviderConfigRepository } from '../../../domain/repositories/i-ai-provider-config-repository';
import { toClientDTO } from './ai-provider-config-helpers';
import { normalizeOpenAICompatibleModelId } from '../../../shared/openai-compatible-normalize';

export class UpdateAIProviderUseCase {
  constructor(private readonly providerConfigRepository: IAIProviderConfigRepository) {}

  async execute(
    identityId: string,
    id: string,
    request: UpdateAIProviderConfigReq,
  ): Promise<Result<AIProviderConfigClientDTO>> {
    const current = await this.providerConfigRepository.findByIdForIdentity(identityId, id);
    if (!current) {
      return error('NOT_FOUND', 'Provider not found');
    }

    const nextIsActive = request.isActive ?? current.isActive;
    const updated: AIProviderConfigServerDTO = {
      ...current,
      name: request.name?.trim() ?? current.name,
      baseUrl: request.baseUrl?.replace(/\/+$/, '') ?? current.baseUrl,
      apiKey: request.apiKey ?? current.apiKey,
      defaultModel:
        request.model != null
          ? normalizeOpenAICompatibleModelId(request.model)
          : current.defaultModel,
      isDefault: nextIsActive && (request.isDefault ?? current.isDefault),
      isActive: nextIsActive,
      updatedAt: Date.now(),
      version: current.version + 1,
    };

    const outcome = await this.providerConfigRepository.save(updated);
    if (outcome === 'CONFLICT') {
      return error('CONFLICT', 'Another provider became default; refresh and try again');
    }
    return ok(toClientDTO(updated));
  }
}
