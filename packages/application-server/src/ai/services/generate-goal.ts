/**
 * Generate Goal Service
 *
 * AI 生成目标应用服务
 */

import type { IAIGenerationTaskRepository, IAIProviderConfigRepository } from '@dailyuse/domain-server/ai';
import type { GenerateGoalRequest, GenerateGoalResponse, GoalCategory } from '@dailyuse/contracts/ai';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';
import { AIContainer } from '@dailyuse/infrastructure-server';

/**
 * Generate Goal Service
 */
export class GenerateGoal {
  private static instance: GenerateGoal;

  private constructor(
    private readonly taskRepository: IAIGenerationTaskRepository,
    private readonly providerRepository: IAIProviderConfigRepository,
  ) {}

  static createInstance(
    taskRepository?: IAIGenerationTaskRepository,
    providerRepository?: IAIProviderConfigRepository,
  ): GenerateGoal {
    const container = AIContainer.getInstance();
    const taskRepo = taskRepository || container.getGenerationTaskRepository();
    const providerRepo = providerRepository || container.getProviderConfigRepository();
    GenerateGoal.instance = new GenerateGoal(taskRepo, providerRepo);
    return GenerateGoal.instance;
  }

  static getInstance(): GenerateGoal {
    if (!GenerateGoal.instance) {
      GenerateGoal.instance = GenerateGoal.createInstance();
    }
    return GenerateGoal.instance;
  }

  static resetInstance(): void {
    GenerateGoal.instance = undefined as unknown as GenerateGoal;
  }

  async execute(accountUuid: string, input: GenerateGoalRequest): Promise<GenerateGoalResponse> {
    // 1. 获取 AI Provider（使用 findByAccountUuid）
    const providers = await this.providerRepository.findByAccountUuid(accountUuid);
    const provider = providers.find((p: any) => p.isDefault) || providers[0];
    if (!provider) {
      throw new Error('No AI provider configured');
    }

    // 2. 生成时间戳
    const now = Date.now();
    const oneMonthLater = now + 30 * 24 * 60 * 60 * 1000;

    // 3. 调用 AI 服务生成目标（这里是骨架，实际需要调用 AI API）
    // TODO: 实际 AI 调用逻辑

    // 4. 返回生成结果
    return {
      goal: {
        title: `Goal: ${input.idea.substring(0, 50)}`,
        description: `AI generated goal based on: ${input.idea}`,
        motivation: 'AI generated motivation',
        category: input.category || ('OTHER' as GoalCategory),
        suggestedStartDate: input.timeframe?.startDate || now,
        suggestedEndDate: input.timeframe?.endDate || oneMonthLater,
        importance: ImportanceLevel.Important,
        urgency: UrgencyLevel.Medium,
        tags: [],
      },
      tokenUsage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      generatedAt: now,
      providerUsed: (provider as any).name || 'default',
      modelUsed: (provider as any).modelId || 'gpt-4',
    };
  }
}
