/**
 * Base AI Adapter
 * AI 提供商抽象基类
 *
 * 职责：
 * - 定义 AI 生成的统一接口
 * - 提供超时保护机制
 * - 标准化请求/响应格式
 */

import type { GenerationTaskType, AIProvider, AIModel, TokenUsageServerDTO } from '@dailyuse/contracts/ai';
import type { AIProviderConfigServerDTO } from '@dailyuse/contracts/ai';

/**
 * AI 生成请求接口
 */
export interface AIGenerationRequest {
  taskType: GenerationTaskType;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  contextData?: Record<string, unknown>;
}

/**
 * AI 生成响应接口（泛型支持结构化输出）
 */
export interface AIGenerationResponse<T = unknown> {
  content: string;
  parsedContent?: T | null;
  tokenUsage: TokenUsageServerDTO;
  generatedAt: Date;
  model: string;
}

/**
 * 流式响应块接口
 */
export interface AIStreamChunk {
  delta: string; // 本次增量文本
  fullText: string; // 累积完整文本
  isDone: boolean; // 是否完成
  tokenUsage?: TokenUsageServerDTO; // 完成时才有 token 统计
}

/**
 * Base AI Adapter 抽象类
 */
export abstract class BaseAIAdapter {
  /**
   * AI 生成超时时间（10秒）
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
   * 健康检查
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * 获取提供商名称
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




