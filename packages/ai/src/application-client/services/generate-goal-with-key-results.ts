/**
 * Generate Goal With Key Results
 *
 * AI 生成目标及关键结果用�?
 */

import type { IAIGenerationTaskApiClient } from '../../infrastructure-client/adapters/types';
import type { GenerateGoalWithKRsRequest, GenerateGoalWithKRsResponse } from '@dailyuse/contracts/ai';
import { AIContainer } from '../../infrastructure-client/ai.container';

/**
 * Generate Goal With Key Results Input
 */
export type GenerateGoalWithKeyResultsInput = GenerateGoalWithKRsRequest;

/**
 * Generate Goal With Key Results
 */
export class GenerateGoalWithKeyResults {
  private static instance: GenerateGoalWithKeyResults;

  private constructor(private readonly apiClient: IAIGenerationTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAIGenerationTaskApiClient): GenerateGoalWithKeyResults {
    const container = AIContainer.getInstance();
    const client = apiClient || container.getGenerationTaskApiClient();
    GenerateGoalWithKeyResults.instance = new GenerateGoalWithKeyResults(client);
    return GenerateGoalWithKeyResults.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GenerateGoalWithKeyResults {
    if (!GenerateGoalWithKeyResults.instance) {
      GenerateGoalWithKeyResults.instance = GenerateGoalWithKeyResults.createInstance();
    }
    return GenerateGoalWithKeyResults.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GenerateGoalWithKeyResults.instance = undefined as unknown as GenerateGoalWithKeyResults;
  }

  /**
   * 执行用例
   */
  async execute(input: GenerateGoalWithKeyResultsInput): Promise<GenerateGoalWithKRsResponse> {
    return this.apiClient.generateGoalWithKeyResults(input);
  }
}

/**
 * 便捷函数
 */
export const generateGoalWithKeyResults = (
  input: GenerateGoalWithKeyResultsInput,
): Promise<GenerateGoalWithKRsResponse> =>
  GenerateGoalWithKeyResults.getInstance().execute(input);
