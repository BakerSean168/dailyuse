import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/IAIProviderConfigRepository';

export class DeleteAIProviderUseCase {
  constructor(private readonly providerConfigRepository: IAIProviderConfigRepository) {}

  async execute(id: string): Promise<Result<void>> {
    await this.providerConfigRepository.delete(id);
    return ok(undefined);
  }
}
