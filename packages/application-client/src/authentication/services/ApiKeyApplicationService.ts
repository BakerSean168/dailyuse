/**
 * API Key Management Application Service
 * API Key 管理应用服务 - 负责 API Key 相关的用例
 *
 * 🔄 包提取版本：
 * - 使用依赖注入的 IAuthApiClient
 * - 不依赖 Store（Store 操作由调用层负责）
 */

import type {
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  ApiKeyListResponse,
  RevokeApiKeyRequest,
} from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client';

export class ApiKeyApplicationService {
  constructor(private readonly authApiClient: IAuthApiClient) {}

  /**
   * 创建 API Key
   */
  async createApiKey(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    return this.authApiClient.createApiKey(request);
  }

  /**
   * 获取 API Key 列表
   */
  async getApiKeys(): Promise<ApiKeyListResponse> {
    return this.authApiClient.getApiKeys();
  }

  /**
   * 撤销 API Key
   */
  async revokeApiKey(request: RevokeApiKeyRequest): Promise<void> {
    return this.authApiClient.revokeApiKey(request);
  }
}

/**
 * 工厂函数 - 创建 API Key 应用服务实例
 */
export function createApiKeyApplicationService(
  authApiClient: IAuthApiClient,
): ApiKeyApplicationService {
  return new ApiKeyApplicationService(authApiClient);
}
