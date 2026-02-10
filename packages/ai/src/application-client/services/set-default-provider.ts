/**
 * Set Default Provider
 *
 * 设置默认 AI Provider 用例
 */

import type { IAIProviderConfigApiClient } from '@/infrastructure-client';
import { AIContainer } from '@/infrastructure-client';

/**
 * Set Default Provider
 */
export class SetDefaultProvider {
  private static instance: SetDefaultProvider;

  private constructor(private readonly apiClient: IAIProviderConfigApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAIProviderConfigApiClient): SetDefaultProvider {
    const container = AIContainer.getInstance();
    const client = apiClient || container.getProviderConfigApiClient();
    SetDefaultProvider.instance = new SetDefaultProvider(client);
    return SetDefaultProvider.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): SetDefaultProvider {
    if (!SetDefaultProvider.instance) {
      SetDefaultProvider.instance = SetDefaultProvider.createInstance();
    }
    return SetDefaultProvider.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    SetDefaultProvider.instance = undefined as unknown as SetDefaultProvider;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<void> {
    await this.apiClient.setDefaultProvider(uuid);
  }
}

/**
 * 便捷函数
 */
export const setDefaultProvider = (uuid: string): Promise<void> =>
  SetDefaultProvider.getInstance().execute(uuid);
