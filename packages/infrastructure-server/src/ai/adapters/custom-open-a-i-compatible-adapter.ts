/**
 * Custom OpenAI Compatible Adapter
 * 鑷畾锟?OpenAI 鍏煎鎺ュ彛閫傞厤锟?
 *
 * 鏀寔锛氫竷鐗涗簯銆丄zure OpenAI銆佸叾锟?OpenAI 鍏煎 API
 *
 * 渚濊禆锟?
 * - ai: Vercel AI SDK 鏍稿績锟?
 * - @ai-sdk/openai: OpenAI provider (鏀寔鑷畾锟?baseURL)
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
 * 鑷畾锟?Provider 閰嶇疆
 */
export interface CustomProviderConfig {
  /** 鎻愪緵鍟嗗悕绉帮紙鐢ㄤ簬鏃ュ織鍜岄敊璇俊鎭級 */
  providerName: string;
  /** API 鍩虹鍦板潃 */
  baseUrl: string;
  /** API Key */
  apiKey: string;
  /** 榛樿妯″瀷 ID */
  defaultModel: string;
  /** 瓒呮椂鏃堕棿锛堟绉掞紝榛樿 30000锟?*/
  timeoutMs?: number;
}

/**
 * Custom OpenAI Compatible Adapter 瀹炵幇
 *
 * 鐢ㄤ簬杩炴帴 OpenAI 鍏煎鐨勭涓夋柟鏈嶅姟锟?
 * - 涓冪墰锟?AI: https://openai.qiniu.com/v1
 * - Azure OpenAI
 * - 鍏朵粬鍏煎 API
 */
export class CustomOpenAICompatibleAdapter extends BaseAIAdapter {
  private readonly openai: ReturnType<typeof createOpenAI>;
  private readonly providerName: string;
  private readonly modelId: string;
  private readonly timeoutMs: number;

  constructor(config: CustomProviderConfig) {
    // 浣跨敤 CUSTOM 浣滀负鍩虹 provider 绫诲瀷
    super(AIProvider.CUSTOM, config.defaultModel as any);

    this.providerName = config.providerName;
    this.modelId = config.defaultModel;
    this.timeoutMs = config.timeoutMs ?? 30000;

    // 鍒涘缓鑷畾锟?OpenAI 鍏煎 provider
    // AI SDK 5.x 榛樿浣跨敤 OpenAI Responses API锛屽浜庣涓夋柟鍏煎鏈嶅姟涔熼€傜敤
    this.openai = createOpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
  }

  /**
   * 涓€娆℃€х敓鎴愭枃鏈紙甯﹁秴鏃跺拰 JSON 瑙ｆ瀽锟?
   */
  async generateText<T = unknown>(request: AIGenerationRequest): Promise<AIGenerationResponse<T>> {
    try {
      const fullPrompt = this.buildPrompt(request);

      // 鍒涘缓瓒呮椂 Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new AIGenerationTimeoutError(this.timeoutMs / 1000));
        }, this.timeoutMs);
      });

      // AI 鐢熸垚 Promise - 浣跨敤 .chat() 鏂规硶璋冪敤 Chat Completions API
      const generationPromise = generateText({
        model: this.openai.chat(this.modelId),
        prompt: fullPrompt,
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens,
      });

      // 绔為€燂細鐢熸垚 vs 瓒呮椂
      const result = await Promise.race([generationPromise, timeoutPromise]);

      // 鎻愬彇 token 浣跨敤缁熻
      const usage = result.usage as any;
      const tokenUsage: TokenUsageServerDTO = {
        promptTokens: usage?.promptTokens ?? 0,
        completionTokens: usage?.completionTokens ?? 0,
        totalTokens:
          usage?.totalTokens ?? (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0),
      };

      // 灏濊瘯瑙ｆ瀽 JSON
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
   * 娴佸紡鐢熸垚鏂囨湰锛圓syncGenerator锟?
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

      // 绛夊緟鏈€缁堢粨鏋滀互鑾峰彇 token 缁熻
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
   * 鍋ュ悍妫€锟?
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
   * 鑾峰彇鎻愪緵鍟嗗悕锟?
   */
  getProviderName(): string {
    return this.providerName;
  }

  /**
   * 鑾峰彇妯″瀷 ID
   */
  getModelId(): string {
    return this.modelId;
  }

  /**
   * 鏋勫缓瀹屾暣 Prompt
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
   * 灏濊瘯瑙ｆ瀽 JSON锛堟敮锟?Markdown 浠ｇ爜鍧楋級
   */
  private tryParseJSON<T>(text: string): T | null {
    try {
      return JSON.parse(text) as T;
    } catch {
      // 灏濊瘯鎻愬彇 Markdown 浠ｇ爜鍧椾腑锟?JSON
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




