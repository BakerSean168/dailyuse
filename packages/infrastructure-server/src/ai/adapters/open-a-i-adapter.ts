/**
 * OpenAI Adapter
 * OpenAI 提供商适配器（使用 Vercel AI SDK）
 *
 * 依赖：
 * - ai: Vercel AI SDK 核心包
 * - @ai-sdk/openai: OpenAI provider
 */

import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import { AIProvider, AIModel } from '@dailyuse/contracts/ai';
import type { AIProviderConfigServerDTO, TokenUsageServerDTO } from '@dailyuse/contracts/ai';
import {
  BaseAIAdapter,
  type AIGenerationRequest,
  type AIGenerationResponse,
  type AIStreamChunk,
} from './BaseAIAdapter';
import { AIGenerationTimeoutError, AIProviderError } from '../errors/AIErrors';

/**
 * OpenAI Adapter 实现
 */
export class OpenAIAdapter extends BaseAIAdapter {
  private readonly openai: ReturnType<typeof createOpenAI>;

  constructor(apiKey: string, defaultModel: AIModel = AIModel.GPT4_TURBO) {
    super(AIProvider.OPENAI, defaultModel);
    this.openai = createOpenAI({
      apiKey,
    });
  }

  /**
   * 一次性生成文本（带超时和 JSON 解析）
   */
  async generateText<T = unknown>(request: AIGenerationRequest): Promise<AIGenerationResponse<T>> {
    try {
      // 构建完整 Prompt
      const fullPrompt = this.buildPrompt(request);

      // 创建超时 Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new AIGenerationTimeoutError(BaseAIAdapter.TIMEOUT_MS / 1000));
        }, BaseAIAdapter.TIMEOUT_MS);
      });

      // AI 生成 Promise
      const generationPromise = generateText({
        model: this.openai(this.defaultModel),
        prompt: fullPrompt,
        temperature: request.temperature ?? 0.7,
      });

      // 竞速：生成 vs 超时
      const result = await Promise.race([generationPromise, timeoutPromise]);

      // 提取 token 使用统计（AI SDK v5 字段名）
      const usage = result.usage as any; // Type compatibility workaround
      const tokenUsage: TokenUsageServerDTO = {
        promptTokens: usage?.promptTokens ?? 0,
        completionTokens: usage?.completionTokens ?? 0,
        totalTokens: usage?.totalTokens ?? (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0),
      };

      // 尝试解析 JSON
      const parsedContent = this.tryParseJSON<T>(result.text);

      return {
        content: result.text,
        parsedContent,
        tokenUsage,
        generatedAt: new Date(),
        model: this.defaultModel,
      };
    } catch (error) {
      if (error instanceof AIGenerationTimeoutError) {
        throw error;
      }
      throw new AIProviderError(
        'OpenAI',
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 流式生成文本（AsyncGenerator）
   */
  async *streamText(request: AIGenerationRequest): AsyncGenerator<AIStreamChunk, void, unknown> {
    try {
      const fullPrompt = this.buildPrompt(request);

      const result = streamText({
        model: this.openai(this.defaultModel),
        prompt: fullPrompt,
        temperature: request.temperature ?? 0.7,
      });

      let fullText = '';

      // 流式输出每个文本块
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
      const usage = (await finalResult.usage) as any; // Type compatibility workaround

      const tokenUsage: TokenUsageServerDTO = {
        promptTokens: usage?.promptTokens ?? 0,
        completionTokens: usage?.completionTokens ?? 0,
        totalTokens: usage?.totalTokens ?? (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0),
      };

      // 发送最后一个块（标记完成 + token 统计）
      yield {
        delta: '',
        fullText,
        isDone: true,
        tokenUsage,
      };
    } catch (error) {
      throw new AIProviderError(
        'OpenAI',
        error instanceof Error ? error.message : 'Stream error',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 健康检查（使用轻量模型测试）
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await generateText({
        model: this.openai(AIModel.GPT35_TURBO),
        prompt: 'Say OK',
      });
      return result.text.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * 构建完整 Prompt（系统 + 上下文 + 用户）
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
   * 尝试解析 JSON（支持 Markdown 代码块）
   */
  private tryParseJSON<T>(text: string): T | null {
    try {
      // 尝试直接解析
      return JSON.parse(text) as T;
    } catch {
      // 尝试提取 Markdown 代码块中的 JSON
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




