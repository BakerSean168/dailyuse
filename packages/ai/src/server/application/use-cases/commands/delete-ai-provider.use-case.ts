import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { IAIProviderConfigRepository } from '../../../domain/repositories/i-ai-provider-config-repository';

export class DeleteAIProviderUseCase {
  constructor(private readonly providerConfigRepository: IAIProviderConfigRepository) {}

  async execute(identityId: string, id: string): Promise<Result<void>> {
    const provider = await this.providerConfigRepository.findByIdForIdentity(identityId, id);
    if (!provider) {
      return error('NOT_FOUND', 'Provider not found');
    }
    await this.providerConfigRepository.delete(identityId, id);
    return ok(undefined);
  }
}
