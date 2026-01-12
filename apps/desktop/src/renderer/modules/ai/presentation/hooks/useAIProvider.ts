/**
 * useAIProvider Hook
 *
 * AI 提供商管理 Hook
 */

import { useState, useCallback } from 'react';
import { aiApplicationService } from '../../application/services';
import type { CreateAIProviderRequest, TestAIProviderConnectionRequest, AIProviderType } from '@dailyuse/contracts/ai';

// Type aliases for backward compatibility
type CreateProviderInput = CreateAIProviderRequest;
type TestProviderConnectionInput = TestAIProviderConnectionRequest;

// 使用推断类型
type AIProvider = Awaited<ReturnType<typeof aiApplicationService.listProviders>>[number];
type AIQuota = Awaited<ReturnType<typeof aiApplicationService.getQuota>>;

export interface AIProviderState {
  providers: AIProvider[];
  quota: AIQuota | null;
  loading: boolean;
  testing: boolean;
  error: string | null;
}

export interface UseAIProviderReturn extends AIProviderState {
  loadProviders: () => Promise<void>;
  loadQuota: () => Promise<void>;
  createProvider: (input: CreateProviderInput) => Promise<AIProvider>;
  testConnection: (input: TestProviderConnectionInput) => Promise<boolean>;
  setDefaultProvider: (providerUuid: string) => Promise<void>;
  checkQuotaAvailability: (tokensNeeded: number) => Promise<boolean>;
}

/**
 * AI 提供商管理 Hook
 */
export function useAIProvider(): UseAIProviderReturn {
  const [state, setState] = useState<AIProviderState>({
    providers: [],
    quota: null,
    loading: false,
    testing: false,
    error: null,
  });

  /**
   * 加载提供商列表
   */
  const loadProviders = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const providers = await aiApplicationService.listProviders();
      setState(prev => ({
        ...prev,
        providers,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '加载提供商失败',
      }));
    }
  }, []);

  /**
   * 加载配额信息
   */
  const loadQuota = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const quota = await aiApplicationService.getQuota();
      setState(prev => ({
        ...prev,
        quota,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '加载配额失败',
      }));
    }
  }, []);

  /**
   * 创建提供商
   */
  const createProvider = useCallback(async (input: CreateProviderInput): Promise<AIProvider> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const provider = await aiApplicationService.createProvider(input);
      setState(prev => ({
        ...prev,
        providers: [...prev.providers, provider as AIProvider],
        loading: false,
      }));
      return provider as AIProvider;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '创建提供商失败',
      }));
      throw error;
    }
  }, []);

  /**
   * 测试连接
   */
  const testConnection = useCallback(async (
    input: TestProviderConnectionInput
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, testing: true, error: null }));
    try {
      const result = await aiApplicationService.testProviderConnection(input);
      setState(prev => ({ ...prev, testing: false }));
      // 返回测试结果的 success 字段
      return result.success ?? false;
    } catch (error) {
      setState(prev => ({
        ...prev,
        testing: false,
        error: error instanceof Error ? error.message : '测试连接失败',
      }));
      return false;
    }
  }, []);

  /**
   * 设置默认提供商
   */
  const setDefaultProvider = useCallback(async (providerUuid: string) => {
    try {
      await aiApplicationService.setDefaultProvider(providerUuid);
      setState(prev => ({
        ...prev,
        providers: prev.providers.map(p => ({
          ...p,
          isDefault: p.uuid === providerUuid,
        })),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '设置默认提供商失败',
      }));
    }
  }, []);

  /**
   * 检查配额可用性
   */
  const checkQuotaAvailability = useCallback(async (tokensNeeded: number): Promise<boolean> => {
    try {
      const result = await aiApplicationService.checkQuotaAvailability(tokensNeeded);
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '检查配额失败',
      }));
      return false;
    }
  }, []);

  return {
    ...state,
    loadProviders,
    loadQuota,
    createProvider,
    testConnection,
    setDefaultProvider,
    checkQuotaAvailability,
  };
}
