/**
 * OpenAI Adapter
 * OpenAI 鎻愪緵鍟嗛€傞厤鍣紙浣跨敤 Vercel AI SDK锟?
 *
 * 渚濊禆锟?
 * - ai: Vercel AI SDK 鏍稿績锟?
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
} from './base-a-i-adapter';
import { AIGenerationTimeoutError, AIProviderError } from '../errors/a-i-errors';

/**
 * OpenAI Adapter 瀹炵幇
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
   * 涓€娆℃€х敓鎴愭枃鏈紙甯﹁秴鏃跺拰 JSON 瑙ｆ瀽锟?
   */
  async generateText<T = unknown>(request: AIGenerationRequest): Promise<AIGenerationResponse<T>> {
    try {
      // 鏋勫缓瀹屾暣 Prompt
      const fullPrompt = this.buildPrompt(request);

      // 鍒涘缓瓒呮椂 Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new AIGenerationTimeoutError(BaseAIAdapter.TIMEOUT_MS / 1000));
        }, BaseAIAdapter.TIMEOUT_MS);
      });

      // AI 鐢熸垚 Promise
      const generationPromise = generateText({
        model: this.openai(this.defaultModel),
        prompt: fullPrompt,
        temperature: request.temperature ?? 0.7,
      });

      // 绔為€燂細鐢熸垚 vs 瓒呮椂
      const result = await Promise.race([generationPromise, timeoutPromise]);

      // 鎻愬彇 token 浣跨敤缁熻锛圓I SDK v5 瀛楁鍚嶏級
      const usage = result.usage as any; // Type compatibility workaround
      const tokenUsage: TokenUsageServerDTO = {
        promptTokens: usage?.promptTokens ?? 0,
        completionTokens: usage?.completionTokens ?? 0,
        totalTokens: usage?.totalTokens ?? (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0),
      };

      // 灏濊瘯瑙ｆ瀽 JSON
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
   * 娴佸紡鐢熸垚鏂囨湰锛圓syncGenerator锟?
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

      // 娴佸紡杈撳嚭姣忎釜鏂囨湰锟?
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
      const usage = (await finalResult.usage) as any; // Type compatibility workaround

      const tokenUsage: TokenUsageServerDTO = {
        promptTokens: usage?.promptTokens ?? 0,
        completionTokens: usage?.completionTokens ?? 0,
        totalTokens: usage?.totalTokens ?? (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0),
      };

      // 鍙戦€佹渶鍚庝竴涓潡锛堟爣璁板畬锟?+ token 缁熻锟?
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
   * 鍋ュ悍妫€鏌ワ紙浣跨敤杞婚噺妯″瀷娴嬭瘯锟?
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
   * 鏋勫缓瀹屾暣 Prompt锛堢郴锟?+ 涓婁笅锟?+ 鐢ㄦ埛锟?
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
      // 灏濊瘯鐩存帴瑙ｆ瀽
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




