/**
 * AI Adapter Factory
 * AI 适配器工厂
 *
 * 职责：
 * - 根据 Provider 配置创建对应的 AI 适配器
 * - 管理适配器缓存（同一配置复用适配器实例）
 * - 支持动态切换用户自定义 Provider
 */

import { AIProviderType, AIModel } from '@dailyuse/contracts/ai';
import type { AIProviderConfigServerDTO } from '@dailyuse/contracts/ai';
import { BaseAIAdapter } from './BaseAIAdapter';
import { OpenAIAdapter } from './OpenAIAdapter';
import { CustomOpenAICompatibleAdapter } from './CustomOpenAICompatibleAdapter';
import { OpenRouterAdapter } from './OpenRouterAdapter';
import { GroqAdapter } from './GroqAdapter';
import { DeepSeekAdapter } from './DeepSeekAdapter';
import { SiliconFlowAdapter } from './SiliconFlowAdapter';
import { env } from '@/shared/infrastructure/config/env.js';

/**
 * 适配器缓存 Key 生成
 */
function getCacheKey(config: AIProviderConfigServerDTO): string {
  return `${config.uuid}:${config.updatedAt}`;
}

/**
 * AI Adapter Factory
 *
 * 用法：
 * ```typescript
 * const adapter = AIAdapterFactory.createFromConfig(providerConfig);
 * const response = await adapter.generateText(request);
 * ```
 */
export class AIAdapterFactory {
  /** 适配器缓存（避免重复创建） */
  private static adapterCache = new Map<string, BaseAIAdapter>();

  /** 默认 OpenAI 适配器（使用环境变量配置） */
  private static defaultAdapter: OpenAIAdapter | null = null;

  /**
   * 从 Provider 配置创建适配器
   */
  static createFromConfig(config: AIProviderConfigServerDTO): BaseAIAdapter {
    const cacheKey = getCacheKey(config);

    // 检查缓存
    if (this.adapterCache.has(cacheKey)) {
      return this.adapterCache.get(cacheKey)!;
    }

    // 根据 Provider 类型创建适配器
    let adapter: BaseAIAdapter;

    switch (config.providerType) {
      case AIProviderType.OPENAI:
        adapter = new OpenAIAdapter(
          config.apiKey,
          (config.defaultModel as AIModel) || AIModel.GPT4_TURBO,
        );
        break;

      case AIProviderType.OPENROUTER:
        adapter = new OpenRouterAdapter({
          apiKey: config.apiKey,
          defaultModel: config.defaultModel || 'google/gemini-2.0-flash-exp:free',
          appName: 'DailyUse',
          timeoutMs: 60000,
        });
        break;

      case AIProviderType.GROQ:
        adapter = new GroqAdapter({
          apiKey: config.apiKey,
          defaultModel: config.defaultModel || 'llama-3.3-70b-versatile',
          timeoutMs: 30000, // Groq 速度快，超时短
        });
        break;

      case AIProviderType.DEEPSEEK:
        adapter = new DeepSeekAdapter({
          apiKey: config.apiKey,
          defaultModel: config.defaultModel || 'deepseek-chat',
          timeoutMs: 60000,
        });
        break;

      case AIProviderType.SILICONFLOW:
        adapter = new SiliconFlowAdapter({
          apiKey: config.apiKey,
          defaultModel: config.defaultModel || 'deepseek-ai/DeepSeek-V3',
          timeoutMs: 60000,
        });
        break;

      case AIProviderType.QINIU:
        adapter = new CustomOpenAICompatibleAdapter({
          providerName: config.name || 'Qiniu',
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          defaultModel: config.defaultModel || 'deepseek-v3',
          timeoutMs: 60000, // 七牛云可能需要更长超时
        });
        break;

      case AIProviderType.GOOGLE:
        adapter = new CustomOpenAICompatibleAdapter({
          providerName: config.name || 'Google AI',
          baseUrl: config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/openai',
          apiKey: config.apiKey,
          defaultModel: config.defaultModel || 'gemini-2.0-flash-exp',
          timeoutMs: 60000,
        });
        break;

      case AIProviderType.ANTHROPIC:
        // TODO: 实现 Anthropic 原生适配器（使用 x-api-key 认证）
        // 暂时使用 OpenAI 兼容模式（如果 API 兼容）
        adapter = new CustomOpenAICompatibleAdapter({
          providerName: config.name || 'Anthropic',
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          defaultModel: config.defaultModel || 'claude-3-sonnet-20240229',
          timeoutMs: 60000,
        });
        break;

      case AIProviderType.CUSTOM_OPENAI_COMPATIBLE:
      default:
        adapter = new CustomOpenAICompatibleAdapter({
          providerName: config.name || 'Custom',
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          defaultModel: config.defaultModel || 'gpt-4',
          timeoutMs: 60000,
        });
        break;
    }

    // 缓存适配器
    this.adapterCache.set(cacheKey, adapter);

    // 清理过期缓存（保持缓存大小合理）
    if (this.adapterCache.size > 50) {
      const firstKey = this.adapterCache.keys().next().value;
      if (firstKey) {
        this.adapterCache.delete(firstKey);
      }
    }

    return adapter;
  }

  /**
   * 获取默认 OpenAI 适配器（使用环境变量）
   * 用于没有用户自定义 Provider 时的回退
   */
  static getDefaultAdapter(): OpenAIAdapter {
    if (!this.defaultAdapter) {
      const apiKey = env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }
      this.defaultAdapter = new OpenAIAdapter(apiKey, AIModel.GPT4_TURBO);
    }
    return this.defaultAdapter;
  }

  /**
   * 从环境变量创建七牛云适配器
   * 用于快速测试七牛云 API
   */
  static getQiniuAdapterFromEnv(): CustomOpenAICompatibleAdapter {
    const apiKey = env.QI_NIU_YUN_API_KEY;
    const baseUrl = env.QI_NIU_YUN_BASE_URL;
    const modelId = env.QI_NIU_YUN_MODEL_ID;

    if (!apiKey || !baseUrl) {
      throw new Error('QI_NIU_YUN_API_KEY and QI_NIU_YUN_BASE_URL must be set');
    }

    return new CustomOpenAICompatibleAdapter({
      providerName: 'Qiniu',
      baseUrl,
      apiKey,
      defaultModel: modelId || 'deepseek-v3',
      timeoutMs: 60000,
    });
  }

  /**
   * 清理适配器缓存
   */
  static clearCache(): void {
    this.adapterCache.clear();
    this.defaultAdapter = null;
  }

  /**
   * 测试 Provider 连接
   * 用于在保存配置前验证连接是否可用
   */
  static async testConnection(config: {
    providerType: AIProviderType;
    baseUrl: string;
    apiKey: string;
    defaultModel?: string;
  }): Promise<{
    ok: boolean;
    message: string;
    latencyMs?: number;
  }> {
    const startTime = Date.now();

    try {
      const tempConfig: AIProviderConfigServerDTO = {
        uuid: 'test-' + Date.now(),
        accountUuid: 'test',
        name: 'Test Connection',
        providerType: config.providerType,
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        defaultModel: config.defaultModel || null,
        availableModels: [],
        isActive: true,
        isDefault: false,
        priority: 100,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const adapter = this.createFromConfig(tempConfig);
      const isHealthy = await adapter.healthCheck();
      const latencyMs = Date.now() - startTime;

      // 清理临时适配器
      this.adapterCache.delete(getCacheKey(tempConfig));

      if (isHealthy) {
        return {
          ok: true,
          message: 'Connection successful',
          latencyMs,
        };
      } else {
        return {
          ok: false,
          message: 'Health check failed',
          latencyMs,
        };
      }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        latencyMs: Date.now() - startTime,
      };
    }
  }
}




