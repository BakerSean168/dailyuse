/**
 * DeepSeek Adapter
 * DeepSeek 国产高性价比模型适配器
 *
 * 特点：
 * - 高性价比，价格优惠
 * - 支持 deepseek-chat, deepseek-coder 等模型
 * - 新用户有免费额度
 * - OpenAI 兼容接口
 *
 * @see https://platform.deepseek.com/api-docs
 */

import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import { AIProvider } from '@dailyuse/contracts/ai';
import type { TokenUsageServerDTO } from '@dailyuse/contracts/ai';
import {
  BaseAIAdapter,
  type AIGenerationRequest,
  type AIGenerationResponse,
  type AIStreamChunk,
} from './BaseAIAdapter';
import { AIGenerationTimeoutError, AIProviderError } from '../errors/AIErrors';

/**
 * DeepSeek 配置
 */
export interface DeepSeekConfig {
  /** API Key */
  apiKey: string;
  /** 默认模型 ID */
  defaultModel: string;
  /** 超时时间（毫秒，默认 60000） */
  timeoutMs?: number;
}

/**
 * DeepSeek Adapter 实现
 *
 * 用法：
 * ```typescript
 * const adapter = new DeepSeekAdapter({
 *   apiKey: 'sk-xxx',
 *   defaultModel: 'deepseek-chat',
 * });
 * const response = await adapter.generateText(request);
 * ```
 */
export class DeepSeekAdapter extends BaseAIAdapter {
  /** DeepSeek API 基础地址 */
  private static readonly BASE_URL = 'https://api.deepseek.com/v1';
  /** 提供商名称 */
  private static readonly PROVIDER_NAME = 'DeepSeek';

  private readonly openai: ReturnType<typeof createOpenAI>;
  private readonly modelId: string;
  private readonly timeoutMs: number;

  constructor(config: DeepSeekConfig) {
    super(AIProvider.CUSTOM, config.defaultModel as any);

    this.modelId = config.defaultModel;
    this.timeoutMs = config.timeoutMs ?? 60000;

    this.openai = createOpenAI({
      apiKey: config.apiKey,
      baseURL: DeepSeekAdapter.BASE_URL,
    });
  }

  /**
   * 一次性生成文本
   */
  async generateText<T = unknown>(request: AIGenerationRequest): Promise<AIGenerationResponse<T>> {
    try {
      const fullPrompt = this.buildPrompt(request);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new AIGenerationTimeoutError(this.timeoutMs / 1000));
        }, this.timeoutMs);
      });

      const generationPromise = generateText({
        model: this.openai.chat(this.modelId),
        prompt: fullPrompt,
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens,
      });

      const result = await Promise.race([generationPromise, timeoutPromise]);

      const usage = result.usage as any;
      const tokenUsage: TokenUsageServerDTO = {
        promptTokens: usage?.promptTokens ?? 0,
        completionTokens: usage?.completionTokens ?? 0,
        totalTokens:
          usage?.totalTokens ?? (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0),
      };

      const parsedContent = this.tryParseJSON<T>(result.text);

      return {
        content: result.text,
        parsedContent,
        tokenUsage,
        generatedAt: new Date(),
        model: this.modelId,
      };
    } catch (error) {
      if (error instanceof AIGenerationTimeoutError) {
        throw error;
      }
      throw new AIProviderError(
        DeepSeekAdapter.PROVIDER_NAME,
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 流式生成文本
   */
  async *streamText(request: AIGenerationRequest): AsyncGenerator<AIStreamChunk, void, unknown> {
    try {
      const fullPrompt = this.buildPrompt(request);

      const result = streamText({
        model: this.openai.chat(this.modelId),
        prompt: fullPrompt,
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens,
      });

      let fullText = '';

      for await (const textPart of result.textStream) {
        fullText += textPart;
        yield {
          delta: textPart,
          fullText,
          isDone: false,
        };
      }

      const finalResult = await result;
      const usage = (await finalResult.usage) as any;

      const tokenUsage: TokenUsageServerDTO = {
        promptTokens: usage?.promptTokens ?? 0,
        completionTokens: usage?.completionTokens ?? 0,
        totalTokens:
          usage?.totalTokens ?? (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0),
      };

      yield {
        delta: '',
        fullText,
        isDone: true,
        tokenUsage,
      };
    } catch (error) {
      throw new AIProviderError(
        DeepSeekAdapter.PROVIDER_NAME,
        error instanceof Error ? error.message : 'Stream error',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await generateText({
        model: this.openai.chat(this.modelId),
        prompt: 'Say OK',
        maxOutputTokens: 10,
      });
      return result.text.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * 获取提供商名称
   */
  getProviderName(): string {
    return DeepSeekAdapter.PROVIDER_NAME;
  }

  /**
   * 获取模型 ID
   */
  getModelId(): string {
    return this.modelId;
  }

  /**
   * 构建完整 Prompt
   */
  private buildPrompt(request: AIGenerationRequest): string {
    const parts: string[] = [];

    if (request.systemPrompt) {
      parts.push(`[SYSTEM]\n${request.systemPrompt}\n`);
    }

    if (request.contextData) {
      parts.push(`[CONTEXT]\n${JSON.stringify(request.contextData, null, 2)}\n`);
    }

    parts.push(`[USER]\n${request.prompt}`);

    return parts.join('\n');
  }

  /**
   * 尝试解析 JSON
   */
  private tryParseJSON<T>(text: string): T | null {
    try {
      return JSON.parse(text) as T;
    } catch {
      const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          return JSON.parse(jsonMatch[1]) as T;
        } catch {
          return null;
        }
      }
      return null;
    }
  }
}
