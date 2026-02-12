/**
 * AI Generate Key Results
 *
 * 通过 AI API 为目标生成关键结果用�?
 * 注意：这�?AI 模块的版本，使用 AI Generation Task API
 */

import type { IAIGenerationTaskApiClient } from '../../infrastructure-client/adapters/types';
import type { GenerateKeyResultsResponse } from '@dailyuse/contracts/ai';
import { AIContainer } from '../../infrastructure-client/ai.container';

/**
 * AI Generate Key Results - 通过 AI API 生成关键结果
 */
export class AIGenerateKeyResults {
  private static instance: AIGenerateKeyResults;

  private constructor(private readonly apiClient: IAIGenerationTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAIGenerationTaskApiClient): AIGenerateKeyResults {
    const container = AIContainer.getInstance();
    const client = apiClient || container.getGenerationTaskApiClient();
    AIGenerateKeyResults.instance = new AIGenerateKeyResults(client);
    return AIGenerateKeyResults.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): AIGenerateKeyResults {
    if (!AIGenerateKeyResults.instance) {
      AIGenerateKeyResults.instance = AIGenerateKeyResults.createInstance();
    }
    return AIGenerateKeyResults.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    AIGenerateKeyResults.instance = undefined as unknown as AIGenerateKeyResults;
  }

  /**
   * 执行用例
   */
  async execute(goalUuid: string): Promise<GenerateKeyResultsResponse> {
    return this.apiClient.generateKeyResults(goalUuid);
  }
}

/**
 * 便捷函数
 */
export const aiGenerateKeyResults = (goalUuid: string): Promise<GenerateKeyResultsResponse> =>
  AIGenerateKeyResults.getInstance().execute(goalUuid);
