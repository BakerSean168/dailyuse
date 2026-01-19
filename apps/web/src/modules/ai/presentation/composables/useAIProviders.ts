/**
 * useAIProviders Composable
 * AI 服务提供商配置 Composable
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - Composable 负责协调 ApplicationService 和状态管理
 * - Service 直接返回 DTO 或抛出错误
 * - Composable 使用 try/catch 处理错误 + 显示通知
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue';
import {
  ListProviders,
  CreateProvider,
  TestProviderConnection,
  SetDefaultProvider,
} from '@dailyuse/application-client/ai';
import type {
  AIProviderConfigClientDTO,
  CreateAIProviderRequest,
  UpdateAIProviderRequest,
} from '@dailyuse/contracts/ai';
import { getGlobalMessage } from '@dailyuse/ui-vuetify';

interface TestConnectionResult {
  success: boolean;
  latencyMs?: number;
  error?: string;
}

interface UseAIProvidersReturn {
  // 状态
  providers: Ref<AIProviderConfigClientDTO[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  testingProviderUuid: Ref<string | null>;

  // 计算属性
  defaultProvider: ComputedRef<AIProviderConfigClientDTO | null>;
  activeProviders: ComputedRef<AIProviderConfigClientDTO[]>;
  hasProviders: ComputedRef<boolean>;

  // 方法
  loadProviders: () => Promise<void>;
  createProvider: (request: CreateAIProviderRequest) => Promise<AIProviderConfigClientDTO | null>;
  updateProvider: (uuid: string, request: UpdateAIProviderRequest) => Promise<boolean>;
  deleteProvider: (uuid: string) => Promise<boolean>;
  testConnection: (uuid: string) => Promise<TestConnectionResult>;
  setDefaultProvider: (uuid: string) => Promise<boolean>;
  getProviderByUuid: (uuid: string) => AIProviderConfigClientDTO | undefined;
}

/**
 * AI Provider 管理 Composable
 */
export function useAIProviders(): UseAIProvidersReturn {
  // ===== 状态 =====
  const providers: Ref<AIProviderConfigClientDTO[]> = ref([]);
  const loading = ref(false);
  const error: Ref<string | null> = ref(null);
  const testingProviderUuid: Ref<string | null> = ref(null);

  const { success: showSuccess, error: showError } = getGlobalMessage();

  // ===== 计算属性 =====
  const defaultProvider = computed(() => {
    return providers.value.find((p) => p.isDefault) || null;
  });

  const activeProviders = computed(() => {
    return providers.value.filter((p) => p.isActive);
  });

  const hasProviders = computed(() => {
    return providers.value.length > 0;
  });

  // ===== 方法 =====

  /**
   * 加载 Provider 列表
   */
  async function loadProviders(): Promise<void> {
    try {
      loading.value = true;
      error.value = null;

      const response = await new ListProviders().execute();
      providers.value = response || [];
    } catch (err: any) {
      error.value = err.message || '加载 AI Provider 失败';
      showError(error.value ?? '加载失败');
      providers.value = [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * 创建 Provider
   */
  async function createProvider(
    request: CreateAIProviderRequest,
  ): Promise<AIProviderConfigClientDTO | null> {
    try {
      loading.value = true;
      error.value = null;

      const provider = await new CreateProvider().execute(request);
      providers.value.push(provider);
      showSuccess('AI Provider 创建成功');
      return provider;
    } catch (err: any) {
      error.value = err.message || '创建 AI Provider 失败';
      showError(error.value ?? '创建失败');
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 更新 Provider
   */
  async function updateProvider(uuid: string, request: UpdateAIProviderRequest): Promise<boolean> {
    try {
      loading.value = true;
      error.value = null;

      const provider = await aiProviderApplicationService.updateProvider(uuid, request);
      const index = providers.value.findIndex((p) => p.uuid === uuid);
      if (index !== -1) {
        providers.value[index] = provider;
      }
      showSuccess('AI Provider 更新成功');
      return true;
    } catch (err: any) {
      error.value = err.message || '更新 AI Provider 失败';
      showError(error.value ?? '更新失败');
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 删除 Provider
   */
  async function deleteProvider(uuid: string): Promise<boolean> {
    try {
      loading.value = true;
      error.value = null;

      await aiProviderApplicationService.deleteProvider(uuid);
      providers.value = providers.value.filter((p) => p.uuid !== uuid);
      showSuccess('AI Provider 已删除');
      return true;
    } catch (err: any) {
      error.value = err.message || '删除 AI Provider 失败';
      showError(error.value ?? '删除失败');
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 测试连接
   */
  async function testConnection(uuid: string): Promise<TestConnectionResult> {
    try {
      testingProviderUuid.value = uuid;
      error.value = null;

      const response = await new TestProviderConnection().execute(uuid);
      if (response.success) {
        showSuccess('连接测试成功');
      }
      return response;
    } catch (err: any) {
      const errorMsg = err.message || '连接测试失败';
      error.value = errorMsg;
      showError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      testingProviderUuid.value = null;
    }
  }

  /**
   * 设为默认 Provider
   */
  async function setDefaultProvider(uuid: string): Promise<boolean> {
    try {
      loading.value = true;
      error.value = null;

      await new SetDefaultProvider().execute(uuid);
      // 更新本地状态
      providers.value.forEach((p) => {
        p.isDefault = p.uuid === uuid;
      });
      showSuccess('已设置为默认 Provider');
      return true;
    } catch (err: any) {
      error.value = err.message || '设置默认 Provider 失败';
      showError(error.value ?? '设置失败');
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取单个 Provider
   */
  function getProviderByUuid(uuid: string): AIProviderConfigClientDTO | undefined {
    return providers.value.find((p) => p.uuid === uuid);
  }

  return {
    // 状态
    providers,
    loading,
    error,
    testingProviderUuid,

    // 计算属性
    defaultProvider,
    activeProviders,
    hasProviders,

    // 方法
    loadProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    testConnection,
    setDefaultProvider,
    getProviderByUuid,
  };
}
