/**
 * List Providers Service
 *
 * 获取 AI Provider 列表应用服务
 */

import type { IAIProviderConfigRepository } from '@dailyuse/domain-server/ai';
import type { AIProviderConfigClientDTO } from '@dailyuse/contracts/ai';
import { AIContainer } from '@dailyuse/infrastructure-server';

/**
 * List Providers Service
 */
export class ListProviders {
  private static instance: ListProviders;

  private constructor(private readonly providerRepository: IAIProviderConfigRepository) {}

  static createInstance(providerRepository?: IAIProviderConfigRepository): ListProviders {
    const container = AIContainer.getInstance();
    const repo = providerRepository || container.getProviderConfigRepository();
    ListProviders.instance = new ListProviders(repo);
    return ListProviders.instance;
  }

  static getInstance(): ListProviders {
    if (!ListProviders.instance) {
      ListProviders.instance = ListProviders.createInstance();
    }
    return ListProviders.instance;
  }

  static resetInstance(): void {
    ListProviders.instance = undefined as unknown as ListProviders;
  }

  async execute(accountUuid: string): Promise<{ providers: AIProviderConfigClientDTO[] }> {
    const providers = await this.providerRepository.findByAccountUuid(accountUuid);

    return {
      providers: providers.map((p: any) => (typeof p.toClientDTO === 'function' ? p.toClientDTO() : p)),
    };
  }
}
