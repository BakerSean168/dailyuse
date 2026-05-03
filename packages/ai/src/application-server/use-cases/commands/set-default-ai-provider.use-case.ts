import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/IAIProviderConfigRepository';

export class SetDefaultAIProviderUseCase {
  constructor(private readonly providerConfigRepository: IAIProviderConfigRepository) {}

  async execute(id: string, cx: ExecutionContext): Promise<Result<void>> {
    const provider = await this.providerConfigRepository.findById(id);
    if (!provider || String(provider.identityId) !== cx.identityId) {
      return error('NOT_FOUND', 'Provider not found');
    }

    await this.providerConfigRepository.clearDefaultForIdentity(cx.identityId);
    await this.providerConfigRepository.save({
      ...provider,
      isDefault: true,
      updatedAt: Date.now(),
      version: provider.version + 1,
    });
    return ok(undefined);
  }
}
