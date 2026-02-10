/**
 * Create Provider
 *
 * 创建 AI Provider 配置用例
 */

import type { IAIProviderConfigApiClient } from '@/infrastructure-client';
import type { CreateAIProviderRequest, AIProviderConfigClientDTO } from '@dailyuse/contracts/ai';
import { AIContainer } from '@/infrastructure-client';

/**
 * Create Provider Input
 */
export type CreateProviderInput = CreateAIProviderRequest;

/**
 * Create Provider
 */
export class CreateProvider {
  private static instance: CreateProvider;

  private constructor(private readonly apiClient: IAIProviderConfigApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAIProviderConfigApiClient): CreateProvider {
    const container = AIContainer.getInstance();
    const client = apiClient || container.getProviderConfigApiClient();
    CreateProvider.instance = new CreateProvider(client);
    return CreateProvider.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateProvider {
    if (!CreateProvider.instance) {
      CreateProvider.instance = CreateProvider.createInstance();
    }
    return CreateProvider.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateProvider.instance = undefined as unknown as CreateProvider;
  }

  /**
   * 执行用例
   */
  async execute(input: CreateProviderInput): Promise<AIProviderConfigClientDTO> {
    return this.apiClient.createProvider(input);
  }
}

/**
 * 便捷函数
 */
export const createProvider = (input: CreateProviderInput): Promise<AIProviderConfigClientDTO> =>
  CreateProvider.getInstance().execute(input);
