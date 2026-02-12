/**
 * Base AI Adapter
 * AI 鎻愪緵鍟嗘娊璞″熀�?
 *
 * 鑱岃矗锛?
 * - 瀹氫�?AI 鐢熸垚鐨勭粺涓€鎺ュ�?
 * - 鎻愪緵瓒呮椂淇濇姢鏈哄埗
 * - 鏍囧噯鍖栬�?鍝嶅簲鏍煎紡
 */

import type { GenerationTaskType, AIProvider, AIModel, TokenUsageServerDTO } from '@dailyuse/contracts/ai';
import type { AIProviderConfigServerDTO } from '@dailyuse/contracts/ai';
import type { IAIAdapter, AIGenerationRequest, AIGenerationResponse, AIStreamChunk } from '../domain-server/interfaces/adapter-types';

export { AIGenerationRequest, AIGenerationResponse, AIStreamChunk };

/**
 * Base AI Adapter 鎶借薄�?
 */
export abstract class BaseAIAdapter implements IAIAdapter {
  /**
   * AI 鐢熸垚瓒呮椂鏃堕棿锛?0绉掞�?
   */
  protected static readonly TIMEOUT_MS = 10000;

  protected constructor(
    protected readonly provider: AIProvider,
    protected readonly defaultModel: AIModel,
  ) {}

  /**
   * 涓€娆℃€х敓鎴愭枃鏈紙甯﹁秴鏃朵繚鎶わ�?
   */
  abstract generateText<T = unknown>(request: AIGenerationRequest): Promise<AIGenerationResponse<T>>;

  /**
   * 娴佸紡鐢熸垚鏂囨�?
   */
  abstract streamText(request: AIGenerationRequest): AsyncGenerator<AIStreamChunk, void, unknown>;

  /**
   * 鍋ュ悍妫€鏌?
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * Get鎻愪緵鍟嗗悕�?
   */
  getProvider(): AIProvider {
    return this.provider;
  }

  /**
   * Get榛樿妯″�?
   */
  getDefaultModel(): AIModel {
    return this.defaultModel;
  }
}




