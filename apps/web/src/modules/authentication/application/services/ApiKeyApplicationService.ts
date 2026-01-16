/**
 * API Key Management Application Service
 * API Key 管理应用服务 - 负责 API Key 相关的用例
 */

import type {
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  ApiKeyListResponse,
  RevokeApiKeyRequest,
} from '@dailyuse/contracts/authentication';
import { useAuthStore } from '../../presentation/stores/authStore';
import { authApiClient } from '../../infrastructure/api/authApiClient';

// Type aliases
type CreateApiKeyRequestDTO = CreateApiKeyRequest;
type RevokeApiKeyRequestDTO = RevokeApiKeyRequest;
type CreateApiKeyResponseDTO = CreateApiKeyResponse;
type ApiKeyListResponseDTO = ApiKeyListResponse;

export class ApiKeyApplicationService {
  private static instance: ApiKeyApplicationService;

  private constructor() {}

  static createInstance(): ApiKeyApplicationService {
    ApiKeyApplicationService.instance = new ApiKeyApplicationService();
    return ApiKeyApplicationService.instance;
  }

  static getInstance(): ApiKeyApplicationService {
    if (!ApiKeyApplicationService.instance) {
      ApiKeyApplicationService.instance = ApiKeyApplicationService.createInstance();
    }
    return ApiKeyApplicationService.instance;
  }

  private get authStore(): ReturnType<typeof useAuthStore> {
    return useAuthStore();
  }

  // ============ API Key 管理用例 ============

  async createApiKey(
    request: CreateApiKeyRequestDTO,
  ): Promise<CreateApiKeyResponseDTO> {
    try {
      this.authStore.setLoading(true);
      const response = await authApiClient.createApiKey(request);
      
      // 添加到列表（注意：完整的key只返回一次，后续列表中只有前缀）
      this.authStore.addApiKey({
        id: response.id,
        name: response.name,
        keyPrefix: response.key.substring(0, 8) + '...', // 只保存前缀
        createdAt: response.createdAt,
        expiresAt: response.expiresAt,
      });
      
      return response;
    } catch (error) {
      console.error('Failed to create API key:', error);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  async getApiKeys(): Promise<ApiKeyListResponseDTO> {
    try {
      this.authStore.setLoading(true);
      const response = await authApiClient.getApiKeys();
      this.authStore.setApiKeys(response.keys);
      return response;
    } catch (error) {
      console.error('Failed to get API keys:', error);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  async revokeApiKey(request: RevokeApiKeyRequestDTO): Promise<void> {
    try {
      this.authStore.setLoading(true);
      await authApiClient.revokeApiKey(request);
      this.authStore.removeApiKey(request.apiKeyId);
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }
}

export const apiKeyApplicationService = ApiKeyApplicationService.getInstance();

