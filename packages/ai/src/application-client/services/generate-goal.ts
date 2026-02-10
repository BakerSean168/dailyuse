/**
 * Generate Goal
 *
 * AI 生成目标建议用例
 */

import type { IAIGenerationTaskApiClient } from '@/infrastructure-client';
import type { GenerateGoalRequest, GenerateGoalResponse } from '@dailyuse/contracts/ai';
import { AIContainer } from '@/infrastructure-client';

/**
 * Generate Goal Input
 */
export type GenerateGoalInput = GenerateGoalRequest;

/**
 * Generate Goal
 */
export class GenerateGoal {
  private static instance: GenerateGoal;

  private constructor(private readonly apiClient: IAIGenerationTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAIGenerationTaskApiClient): GenerateGoal {
    const container = AIContainer.getInstance();
    const client = apiClient || container.getGenerationTaskApiClient();
    GenerateGoal.instance = new GenerateGoal(client);
    return GenerateGoal.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GenerateGoal {
    if (!GenerateGoal.instance) {
      GenerateGoal.instance = GenerateGoal.createInstance();
    }
    return GenerateGoal.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GenerateGoal.instance = undefined as unknown as GenerateGoal;
  }

  /**
   * 执行用例
   */
  async execute(input: GenerateGoalInput): Promise<GenerateGoalResponse> {
    return this.apiClient.generateGoal(input);
  }
}

/**
 * 便捷函数
 */
export const generateGoal = (input: GenerateGoalInput): Promise<GenerateGoalResponse> =>
  GenerateGoal.getInstance().execute(input);
