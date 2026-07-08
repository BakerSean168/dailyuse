import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type {
  AIProviderConfigServerDTO,
  UpdateAIProviderConfigReq,
  AIProviderConfigClientDTO,
} from '@dailyuse/contracts/ai';
import type { IAIProviderConfigRepository } from '../../../domain/repositories/i-ai-provider-config-repository';
import { toClientDTO } from './ai-provider-config-helpers';

export class UpdateAIProviderUseCase {
  constructor(private readonly providerConfigRepository: IAIProviderConfigRepository) {}

  async execute(
    id: string,
    request: UpdateAIProviderConfigReq,
  ): Promise<Result<AIProviderConfigClientDTO>> {
    const current = await this.providerConfigRepository.findById(id);
    if (!current) {
      return error('NOT_FOUND', 'Provider not found');
    }

    if (request.isDefault) {
      await this.providerConfigRepository.clearDefaultForIdentity(String(current.identityId));
    }

    const updated: AIProviderConfigServerDTO = {
      ...current,
      name: request.name?.trim() ?? current.name,
      baseUrl: request.baseUrl?.replace(/\/+$/, '') ?? current.baseUrl,
      apiKey: request.apiKey ?? current.apiKey,
      defaultModel: request.model ?? current.defaultModel,
      isDefault: request.isDefault ?? current.isDefault,
      isActive: request.isActive ?? current.isActive,
      updatedAt: Date.now(),
      version: current.version + 1,
    };

    await this.providerConfigRepository.save(updated);
    return ok(toClientDTO(updated));
  }
}
