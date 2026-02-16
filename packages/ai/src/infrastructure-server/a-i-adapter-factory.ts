/**
 * AI Adapter Factory
 * AI 閫傞厤鍣ㄥ伐锟?
 *
 * 鑱岃矗锟?
 * - 鏍规嵁 Provider 閰嶇疆Create瀵瑰簲锟?AI 閫傞厤锟?
 * - 绠＄悊閫傞厤鍣ㄧ紦瀛橈紙鍚屼竴閰嶇疆澶嶇敤閫傞厤鍣ㄥ疄渚嬶級
 * - 鏀寔鍔ㄦ€佸垏鎹㈢敤鎴疯嚜瀹氫箟 Provider
 */

import { AIProviderType, AIModel } from '@dailyuse/contracts/ai';
import type { AIProviderConfigServerDTO } from '@dailyuse/contracts/ai';
import { BaseAIAdapter } from './base-a-i-adapter';
import { OpenAIAdapter } from './open-a-i-adapter';
import { CustomOpenAICompatibleAdapter } from './custom-open-a-i-compatible-adapter';
import { OpenRouterAdapter } from './open-router-adapter';
import { GroqAdapter } from './groq-adapter';
import { DeepSeekAdapter } from './deep-seek-adapter';
import { SiliconFlowAdapter } from './silicon-flow-adapter';
import { env } from '../../shared/config/env';

/**
 * 閫傞厤鍣ㄧ紦锟?Key 鐢熸垚
 */
function getCacheKey(config: AIProviderConfigServerDTO): string {
  return `${config.id}:${config.updatedAt}`;
}

/**
 * AI Adapter Factory
 *
 * 鐢ㄦ硶锟?
 * ```typescript
 * const adapter = AIAdapterFactory.createFromConfig(providerConfig);
 * const response = await adapter.generateText(request);
 * ```
 */
export class AIAdapterFactory {
  /** 閫傞厤鍣ㄧ紦瀛橈紙閬垮厤閲嶅Create锟?*/
  private static adapterCache = new Map<string, BaseAIAdapter>();

  /** 榛樿 OpenAI 閫傞厤鍣紙浣跨敤鐜鍙橀噺閰嶇疆锟?*/
  private static defaultAdapter: OpenAIAdapter | null = null;

  /**
   * 锟?Provider 閰嶇疆Create閫傞厤锟?
   */
  static createFromConfig(config: AIProviderConfigServerDTO): BaseAIAdapter {
    const cacheKey = getCacheKey(config);

    // 妫€鏌ョ紦锟?
    if (this.adapterCache.has(cacheKey)) {
      return this.adapterCache.get(cacheKey)!;
    }

    // 鏍规嵁 Provider 绫诲瀷Create閫傞厤锟?
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
          timeoutMs: 30000, // Groq 閫熷害蹇紝瓒呮椂锟?
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
          timeoutMs: 60000, // 涓冪墰浜戝彲鑳介渶瑕佹洿闀胯秴锟?
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
        // TODO: 瀹炵幇 Anthropic 鍘熺敓閫傞厤鍣紙浣跨敤 x-api-key 璁よ瘉锟?
        // 鏆傛椂浣跨敤 OpenAI 鍏煎妯″紡锛堝锟?API 鍏煎锟?
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

    // 缂撳瓨閫傞厤锟?
    this.adapterCache.set(cacheKey, adapter);

    // 娓呯悊杩囨湡缂撳瓨锛堜繚鎸佺紦瀛樺ぇ灏忓悎鐞嗭級
    if (this.adapterCache.size > 50) {
      const firstKey = this.adapterCache.keys().next().value;
      if (firstKey) {
        this.adapterCache.delete(firstKey);
      }
    }

    return adapter;
  }

  /**
   * Get榛樿 OpenAI 閫傞厤鍣紙浣跨敤鐜鍙橀噺锟?
   * 鐢ㄤ簬娌℃湁鐢ㄦ埛鑷畾锟?Provider 鏃剁殑鍥為€€
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
   * 浠庣幆澧冨彉閲忓垱寤轰竷鐗涗簯閫傞厤锟?
   * 鐢ㄤ簬蹇€熸祴璇曚竷鐗涗簯 API
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
   * 娓呯悊閫傞厤鍣ㄧ紦锟?
   */
  static clearCache(): void {
    this.adapterCache.clear();
    this.defaultAdapter = null;
  }

  /**
   * 娴嬭瘯 Provider 杩炴帴
   * 鐢ㄤ簬鍦ㄤ繚瀛橀厤缃墠楠岃瘉杩炴帴鏄惁鍙敤
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
        id: 'test-' + Date.now(),
        identityId: 'test',
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

      // 娓呯悊涓存椂閫傞厤锟?
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




