import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { AIProviderConfigClientDTO } from '@dailyuse/contracts/ai';
import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/IAIProviderConfigRepository';
import { toClientDTO } from './ai-provider-config-helpers';

export class GetAIProviderUseCase {
  constructor(private readonly providerConfigRepository: IAIProviderConfigRepository) {}

  async execute(id: string): Promise<Result<AIProviderConfigClientDTO>> {
    const provider = await this.providerConfigRepository.findById(id);
    if (!provider) {
      return error('NOT_FOUND', 'Provider not found');
    }
    return ok(toClientDTO(provider));
  }
}
