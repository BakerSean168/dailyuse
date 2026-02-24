/**
 * List Providers Service
 *
 * 列出 AI 提供商应用服务
 */

import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/IAIProviderConfigRepository';
import type { AIProviderConfigServerDTO } from '@dailyuse/contracts/ai';
// import { AIContainer } from '@dailyuse/ai/infrastructure-server';

/**
 * List Providers Service
 */
export class ListProviders {
  constructor(private readonly providerRepository: IAIProviderConfigRepository) {}

  async execute(identityId: string): Promise<AIProviderConfigServerDTO[]> {
    return this.providerRepository.findByIdentityId(identityId);
  }
}
