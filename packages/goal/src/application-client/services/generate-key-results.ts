/**
 * Generate Key Results
 *
 * AI 生成关键结果用例
 */

import type { IGoalApiClient } from '@/infrastructure-client';
import { GoalContainer } from '@/infrastructure-client';

/**
 * Generate Key Results
 */
export class GenerateKeyResults {
  private static instance: GenerateKeyResults;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): GenerateKeyResults {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GenerateKeyResults.instance = new GenerateKeyResults(client);
    return GenerateKeyResults.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GenerateKeyResults {
    if (!GenerateKeyResults.instance) {
      GenerateKeyResults.instance = GenerateKeyResults.createInstance();
    }
    return GenerateKeyResults.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GenerateKeyResults.instance = undefined as unknown as GenerateKeyResults;
  }

  /**
   * 执行用例
   */
  async execute(params: {
    goalTitle: string;
    goalDescription?: string;
    startDate: number;
    endDate: number;
    goalContext?: string;
  }): Promise<{
    keyResults: Array<{
      title: string;
      description?: string;
      targetValue?: number;
      unit?: string;
    }>;
    tokenUsage: unknown;
    generatedAt: number;
  }> {
    return this.apiClient.generateKeyResults(params);
  }
}
