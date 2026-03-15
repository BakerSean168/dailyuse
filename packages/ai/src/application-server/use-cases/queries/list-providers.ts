/**
 * List Providers Service
 *
 * 获取 AI Provider 列表应用服务
 */

import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/IAIProviderConfigRepository';
import type { AIProviderConfigClientDTO } from '@dailyuse/contracts/ai';

/**
 * List Providers Service
 */
export class ListProviders {
  constructor(private readonly providerRepository: IAIProviderConfigRepository) {}

  async execute(identityId: string): Promise<{ providers: AIProviderConfigClientDTO[] }> {
    const providers = await this.providerRepository.findByIdentityId(identityId);

    return {
      providers: providers.map((p: any) =>
        typeof p.toClientDTO === 'function' ? p.toClientDTO() : p,
      ),
    };
  }
}
