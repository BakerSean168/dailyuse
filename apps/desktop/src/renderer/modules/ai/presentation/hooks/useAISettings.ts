/**
 * useAISettings Hook
 *
 * AI 设置管理 Hook
 * Story-009: AI Module UI
 */

import { useState, useEffect, useCallback } from 'react';
import { aiApplicationService } from '@dailyuse/ai/application-client';
import type {
  AIProviderConfigClientDTO,
  AIProviderConfigSummary,
  CreateAIProviderRequest,
  UpdateAIProviderRequest,
} from '@dailyuse/contracts/ai';

interface AISettingsState {
  providers: AIProviderConfigSummary[];
  currentProvider: AIProviderConfigClientDTO | null;
  loading: boolean;
  testing: boolean;
  error: string | null;
  testResult: { ok: boolean; message: string } | null;
}

interface UseAISettingsReturn extends AISettingsState {
  // Provider management
  loadProviders: () => Promise<void>;
  createProvider: (request: CreateAIProviderRequest) => Promise<AIProviderConfigClientDTO>;
  updateProvider: (id: string, request: UpdateAIProviderRequest) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  selectProvider: (id: string) => Promise<void>;
  setDefaultProvider: (id: string) => Promise<void>;

  // Testing
  testConnection: (id: string) => Promise<void>;
  refreshModels: (id: string) => Promise<void>;

  // Utilities
  clearError: () => void;
  clearTestResult: () => void;
}

export function useAISettings(): UseAISettingsReturn {
  const [state, setState] = useState<AISettingsState>({
    providers: [],
    currentProvider: null,
    loading: false,
    testing: false,
    error: null,
    testResult: null,
  });

  // Load providers list
  const loadProviders = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const providers = await aiApplicationService.listProviders();
      setState((prev) => ({
        ...prev,
        providers,
        loading: false,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载服务商列表失败';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  // Create provider
  const createProvider = useCallback(
    async (request: CreateAIProviderRequest) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const provider = await aiApplicationService.createProvider(request);
        await loadProviders();
        setState((prev) => ({
          ...prev,
          currentProvider: provider,
          loading: false,
        }));
        return provider;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '创建服务商失败';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw e;
      }
    },
    [loadProviders],
  );

  // Update provider
  const updateProvider = useCallback(
    async (id: string, request: UpdateAIProviderRequest) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const provider = await aiApplicationService.updateProvider(id, request);
        await loadProviders();
        setState((prev) => ({
          ...prev,
          currentProvider: prev.currentProvider?.id === id ? provider : prev.currentProvider,
          loading: false,
        }));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '更新服务商失败';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw e;
      }
    },
    [loadProviders],
  );

  // Delete provider
  const deleteProvider = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await aiApplicationService.deleteProvider(id);
      setState((prev) => ({
        ...prev,
        providers: prev.providers.filter((p) => p.id !== id),
        currentProvider: prev.currentProvider?.id === id ? null : prev.currentProvider,
        loading: false,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '删除服务商失败';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw e;
    }
  }, []);

  // Select provider (get details)
  const selectProvider = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const provider = await aiApplicationService.getProvider(id);
      setState((prev) => ({
        ...prev,
        currentProvider: provider,
        loading: false,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '获取服务商详情失败';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  // Set default provider
  const setDefaultProvider = useCallback(
    async (id: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        await aiApplicationService.setDefaultProvider(id);
        await loadProviders();
        setState((prev) => ({ ...prev, loading: false }));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '设置默认服务商失败';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw e;
      }
    },
    [loadProviders],
  );

  // Test connection
  const testConnection = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, testing: true, testResult: null }));

    try {
      // First get provider details, then test
      const provider = await aiApplicationService.getProvider(id);
      const result = await aiApplicationService.testProviderConnection({
        providerType: provider.providerType,
        baseUrl: provider.baseUrl,
        apiKey: '', // API key is managed server-side for existing providers
      });
      setState((prev) => ({
        ...prev,
        testing: false,
        testResult: {
          ok: result.ok,
          message: result.message || (result.ok ? '连接成功' : '连接失败'),
        },
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '测试连接失败';
      setState((prev) => ({
        ...prev,
        testing: false,
        testResult: { ok: false, message: errorMessage },
      }));
    }
  }, []);

  // Refresh models
  const refreshModels = useCallback(
    async (id: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        await aiApplicationService.refreshModels(id);
        // Reload provider to get updated models
        await selectProvider(id);
        setState((prev) => ({ ...prev, loading: false }));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '刷新模型列表失败';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw e;
      }
    },
    [selectProvider],
  );

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Clear test result
  const clearTestResult = useCallback(() => {
    setState((prev) => ({ ...prev, testResult: null }));
  }, []);

  // Load providers on mount
  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  return {
    providers: state.providers,
    currentProvider: state.currentProvider,
    loading: state.loading,
    testing: state.testing,
    error: state.error,
    testResult: state.testResult,
    loadProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    selectProvider,
    setDefaultProvider,
    testConnection,
    refreshModels,
    clearError,
    clearTestResult,
  };
}

export default useAISettings;
