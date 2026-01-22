/**
 * Custom OpenAI Compatible Adapter
 * 自定�?OpenAI 兼容接口适配�?
 *
 * 支持：七牛云、Azure OpenAI、其�?OpenAI 兼容 API
 *
 * 依赖�?
 * - ai: Vercel AI SDK 核心�?
 * - @ai-sdk/openai: OpenAI provider (支持自定�?baseURL)
 */

import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import { AIProvider } from '@dailyuse/contracts/ai';
import type { AIProviderConfigServerDTO, TokenUsageServerDTO } from '@dailyuse/contracts/ai';
import {
  BaseAIAdapter,
  type AIGenerationRequest,
  type AIGenerationResponse,
  type AIStreamChunk,
} from './base-a-i-adapter';
import { AIGenerationTimeoutError, AIProviderError } from '../errors/a-i-errors';

/**
 * 自定�?Provider 配置
 */
export interface CustomProviderConfig {
  /** 提供商名称（用于日志和错误信息） */
  providerName: string;
  /** API 基础地址 */
  baseUrl: string;
  /** API Key */
  apiKey: string;
  /** 默认模型 ID */
  defaultModel: string;
  /** 超时时间（毫秒，默认 30000�?*/
  timeoutMs?: number;
}

/**
 * Custom OpenAI Compatible Adapter 实现
 *
 * 用于连接 OpenAI 兼容的第三方服务�?
 * - 七牛�?AI: https://openai.qiniu.com/v1
 * - Azure OpenAI
 * - 其他兼容 API
 */
export class CustomOpenAICompatibleAdapter extends BaseAIAdapter {
  private readonly openai: ReturnType<typeof createOpenAI>;
  private readonly providerName: string;
  private readonly modelId: string;
  private readonly timeoutMs: number;

  constructor(config: CustomProviderConfig) {
    // 使用 CUSTOM 作为基础 provider 类型
    super(AIProvider.CUSTOM, config.defaultModel as any);

    this.providerName = config.providerName;
    this.modelId = config.defaultModel;
    this.timeoutMs = config.timeoutMs ?? 30000;

    // 创建自定�?OpenAI 兼容 provider
    // AI SDK 5.x 默认使用 OpenAI Responses API，对于第三方兼容服务也适用
    this.openai = createOpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
  }

  /**
   * 一次性生成文本（带超时和 JSON 解析�?
   */
  async generateText<T = unknown>(request: AIGenerationRequest): Promise<AIGenerationResponse<T>> {
    try {
      const fullPrompt = this.buildPrompt(request);

      // 创建超时 Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new AIGenerationTimeoutError(this.timeoutMs / 1000));
        }, this.timeoutMs);
      });

      // AI 生成 Promise - 使用 .chat() 方法调用 Chat Completions API
      const generationPromise = generateText({
        model: this.openai.chat(this.modelId),
        prompt: fullPrompt,
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens,
      });

      // 竞速：生成 vs 超时
      const result = await Promise.race([generationPromise, timeoutPromise]);

      // 提取 token 使用统计
      const usage = result.usage as any;
      const tokenUsage: TokenUsageServerDTO = {
        promptTokens: usage?.promptTokens ?? 0,
        completionTokens: usage?.completionTokens ?? 0,
        totalTokens:
          usage?.totalTokens ?? (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0),
      };

      // 尝试解析 JSON
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
        this.providerName,
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 流式生成文本（AsyncGenerator�?
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

      // 等待最终结果以获取 token 统计
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
        this.providerName,
        error instanceof Error ? error.message : 'Stream error',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 健康检�?
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
   * 获取提供商名�?
   */
  getProviderName(): string {
    return this.providerName;
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
   * 尝试解析 JSON（支�?Markdown 代码块）
   */
  private tryParseJSON<T>(text: string): T | null {
    try {
      return JSON.parse(text) as T;
    } catch {
      // 尝试提取 Markdown 代码块中�?JSON
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




