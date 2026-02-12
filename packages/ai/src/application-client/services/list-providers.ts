/**
 * List Providers
 *
 * 获取 AI Provider 列表用例
 */

import type { IAIProviderConfigApiClient } from '../../infrastructure-client/adapters/types';
import type { AIProviderConfigSummary } from '@dailyuse/contracts/ai';
import { AIContainer } from '../../infrastructure-client/ai.container';

/**
 * List Providers
 */
export class ListProviders {
  private static instance: ListProviders;

  private constructor(private readonly apiClient: IAIProviderConfigApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAIProviderConfigApiClient): ListProviders {
    const container = AIContainer.getInstance();
    const client = apiClient || container.getProviderConfigApiClient();
    ListProviders.instance = new ListProviders(client);
    return ListProviders.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ListProviders {
    if (!ListProviders.instance) {
      ListProviders.instance = ListProviders.createInstance();
    }
    return ListProviders.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListProviders.instance = undefined as unknown as ListProviders;
  }

  /**
   * 执行用例
   */
  async execute(): Promise<AIProviderConfigSummary[]> {
    return this.apiClient.getProviders();
  }
}

/**
 * 便捷函数
 */
export const listProviders = (): Promise<AIProviderConfigSummary[]> =>
  ListProviders.getInstance().execute();
