/**
 * Revoke API Key Use Case
 *
 * 撤销 API Key 用例
 */

import type { RevokeApiKeyRequest } from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client';
import { AuthContainer } from '@dailyuse/infrastructure-client';

/**
 * Revoke API Key Use Case
 */
export class RevokeApiKey {
  private static instance: RevokeApiKey;

  private constructor(private readonly apiClient: IAuthApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAuthApiClient): RevokeApiKey {
    const container = AuthContainer.getInstance();
    const client = apiClient || container.getApiClient();
    RevokeApiKey.instance = new RevokeApiKey(client);
    return RevokeApiKey.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): RevokeApiKey {
    if (!RevokeApiKey.instance) {
      RevokeApiKey.instance = RevokeApiKey.createInstance();
    }
    return RevokeApiKey.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    RevokeApiKey.instance = undefined as unknown as RevokeApiKey;
  }

  /**
   * 执行用例
   */
  async execute(input: RevokeApiKeyRequest): Promise<void> {
    return this.apiClient.revokeApiKey(input);
  }
}
