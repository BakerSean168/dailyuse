/**
 * Base AI Adapter
 * AI 提供商抽象基�?
 *
 * 职责�?
 * - 定义 AI 生成的统一接口
 * - 提供超时保护机制
 * - 标准化请�?响应格式
 */

import type { GenerationTaskType, AIProvider, AIModel, TokenUsageServerDTO } from '@dailyuse/contracts/ai';
import type { AIProviderConfigServerDTO } from '@dailyuse/contracts/ai';
import type { IAIAdapter, AIGenerationRequest, AIGenerationResponse, AIStreamChunk } from '@dailyuse/domain-server/ai';

export { AIGenerationRequest, AIGenerationResponse, AIStreamChunk };

/**
 * Base AI Adapter 抽象�?
 */
export abstract class BaseAIAdapter implements IAIAdapter {
  /**
   * AI 生成超时时间�?0秒）
   */
  protected static readonly TIMEOUT_MS = 10000;

  protected constructor(
    protected readonly provider: AIProvider,
    protected readonly defaultModel: AIModel,
  ) {}

  /**
   * 一次性生成文本（带超时保护）
   */
  abstract generateText<T = unknown>(request: AIGenerationRequest): Promise<AIGenerationResponse<T>>;

  /**
   * 流式生成文本
   */
  abstract streamText(request: AIGenerationRequest): AsyncGenerator<AIStreamChunk, void, unknown>;

  /**
   * 健康检�?
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * 获取提供商名�?
   */
  getProvider(): AIProvider {
    return this.provider;
  }

  /**
   * 获取默认模型
   */
  getDefaultModel(): AIModel {
    return this.defaultModel;
  }
}




