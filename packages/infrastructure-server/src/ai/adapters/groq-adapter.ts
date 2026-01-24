/**
 * Groq Adapter
 * Groq 瓒呴珮閫熸帹鐞嗘湇鍔￠€傞厤锟?
 *
 * 鐗圭偣锟?
 * - 鏋佸揩鐨勬帹鐞嗛€熷害锛圠PU 纭欢鍔犻€燂級
 * - 鍏嶈垂棰濆害鎱锋叏
 * - 鏀寔 Llama, Mixtral 绛夊紑婧愭ā锟?
 * - OpenAI 鍏煎鎺ュ彛
 *
 * @see https://console.groq.com/docs
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
} from './base-a-i-adapter';
import { AIGenerationTimeoutError, AIProviderError } from '../errors/a-i-errors';

/**
 * Groq 閰嶇疆
 */
export interface GroqConfig {
  /** API Key */
  apiKey: string;
  /** 榛樿妯″瀷 ID */
  defaultModel: string;
  /** 瓒呮椂鏃堕棿锛堟绉掞紝榛樿 30000锛孏roq 寰堝揩锟?*/
  timeoutMs?: number;
}

/**
 * Groq Adapter 瀹炵幇
 *
 * 鐢ㄦ硶锟?
 * ```typescript
 * const adapter = new GroqAdapter({
 *   apiKey: 'gsk_xxx',
 *   defaultModel: 'llama-3.3-70b-versatile',
 * });
 * const response = await adapter.generateText(request);
 * ```
 */
export class GroqAdapter extends BaseAIAdapter {
  /** Groq API 鍩虹鍦板潃 */
  private static readonly BASE_URL = 'https://api.groq.com/openai/v1';
  /** 鎻愪緵鍟嗗悕锟?*/
  private static readonly PROVIDER_NAME = 'Groq';

  private readonly openai: ReturnType<typeof createOpenAI>;
  private readonly modelId: string;
  private readonly timeoutMs: number;

  constructor(config: GroqConfig) {
    super(AIProvider.CUSTOM, config.defaultModel as any);

    this.modelId = config.defaultModel;
    // Groq 鎺ㄧ悊閫熷害鏋佸揩锛岄粯璁よ秴鏃惰缃緝锟?
    this.timeoutMs = config.timeoutMs ?? 30000;

    this.openai = createOpenAI({
      apiKey: config.apiKey,
      baseURL: GroqAdapter.BASE_URL,
    });
  }

  /**
   * 涓€娆℃€х敓鎴愭枃锟?
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
        GroqAdapter.PROVIDER_NAME,
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 娴佸紡鐢熸垚鏂囨湰
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
        GroqAdapter.PROVIDER_NAME,
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
    return GroqAdapter.PROVIDER_NAME;
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
   * 灏濊瘯瑙ｆ瀽 JSON
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
