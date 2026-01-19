/**
 * API Key Composable
 * API 密钥管理组合式 API
 *
 * 职责:
 * - 调用 ApiKeyApplicationService 获取数据
 * - 管理 API 密钥的生命周期
 * - 处理密钥创建、列表和撤销
 */

import { computed, ref } from 'vue';
import { useAuthenticationStore } from '../stores/authenticationStore';
import type {
  CreateApiKeyRequestDTO,
  RevokeApiKeyRequestDTO,
  CreateApiKeyResponseDTO,
  ApiKeyListResponseDTO,
} from '@dailyuse/contracts/account';
import {
  CreateApiKey,
  ListApiKeys,
  RevokeApiKey,
} from '@dailyuse/application-client/authentication';

export function useApiKey() {
  const authStore = useAuthenticationStore();
  const createApiKeyUseCase = CreateApiKey.getInstance();
  const listApiKeysUseCase = ListApiKeys.getInstance();
  const revokeApiKeyUseCase = RevokeApiKey.getInstance();

  // ============ State ============
  const isLoading = computed(() => authStore.isLoading);
  const error = computed(() => authStore.error);
  const apiKeys = ref<ApiKeyListResponseDTO | null>(null);

  // ============ API Key Methods ============

  /**
   * 创建 API 密钥
   */
  async function createApiKey(
    request: CreateApiKeyRequestDTO,
  ): Promise<CreateApiKeyResponseDTO | null> {
    authStore.setLoading(true);
    try {
      const response = await createApiKeyUseCase.execute(request);
      authStore.setError(null);
      // 重新加载密钥列表
      await loadApiKeys();
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建 API 密钥失败';
      authStore.setError(errorMessage);
      console.error('❌ [useApiKey] 创建 API 密钥失败:', err);
      return null;
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 获取 API 密钥列表
   */
  async function loadApiKeys(): Promise<ApiKeyListResponseDTO | null> {
    authStore.setLoading(true);
    try {
      const response = await listApiKeysUseCase.execute();
      apiKeys.value = response;
      authStore.setError(null);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取 API 密钥列表失败';
      authStore.setError(errorMessage);
      console.error('❌ [useApiKey] 获取 API 密钥列表失败:', err);
      return null;
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 撤销 API 密钥
   */
  async function revokeApiKey(request: RevokeApiKeyRequestDTO): Promise<boolean> {
    authStore.setLoading(true);
    try {
      await revokeApiKeyUseCase.execute(request);
      authStore.setError(null);
      // 重新加载密钥列表
      await loadApiKeys();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '撤销 API 密钥失败';
      authStore.setError(errorMessage);
      console.error('❌ [useApiKey] 撤销 API 密钥失败:', err);
      return false;
    } finally {
      authStore.setLoading(false);
    }
  }

  return {
    // State
    isLoading,
    error,
    apiKeys,

    // Actions
    createApiKey,
    loadApiKeys,
    revokeApiKey,
  };
}
