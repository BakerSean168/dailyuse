import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { AIProviderConfigClientDTO } from '@dailyuse/contracts/ai';
import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/IAIProviderConfigRepository';
import { toClientDTO } from './ai-provider-config-helpers';

export class GetDefaultAIProviderUseCase {
  constructor(private readonly providerConfigRepository: IAIProviderConfigRepository) {}

  async execute(cx: ExecutionContext): Promise<Result<AIProviderConfigClientDTO | null>> {
    const provider = await this.providerConfigRepository.findDefaultByIdentityId(cx.identityId);
    return ok(provider ? toClientDTO(provider) : null);
  }
}
