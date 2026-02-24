/**
 * Generate Goal Service
 *
 * AI 生成目标应用服务
 */

import type { IAIGenerationTaskRepository } from '../../../domain-server/repositories/IAIGenerationTaskRepository';
import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/IAIProviderConfigRepository';
import type { GenerateGoalsReq, GenerateGoalsRes } from '@dailyuse/contracts/ai';
// import { AIContainer } from '@dailyuse/ai/infrastructure-server';

/**
 * Generate Goal Service
 */
export class GenerateGoal {
  constructor(
    private readonly taskRepository: IAIGenerationTaskRepository,
    private readonly providerRepository: IAIProviderConfigRepository,
  ) {}

  async execute(identityId: string, input: GenerateGoalsReq): Promise<GenerateGoalsRes> {
    // 1. 获取 AI Provider（使?findByAccountId?
    const providers = await this.providerRepository.findByIdentityId(identityId);
    const provider = providers.find((p: any) => p.isDefault) || providers[0];
    if (!provider) {
      throw new Error('No AI provider configured');
    }

    // 2. 生成时间?
    const now = Date.now();
    const oneMonthLater = now + 30 * 24 * 60 * 60 * 1000;

    // 3. 调用 AI 服务生成目标（这里是骨架，实际需要调?AI API?
    // TODO: 实际 AI 调用逻辑

    // 4. 返回生成结果
    return {
      goal: {
        title: `Goal: ${input.description.substring(0, 50)}`,
        description: `AI generated goal based on: ${input.description}`,
        motivation: 'AI generated motivation',
        category: (input.category as any) || 'other',
        suggestedStartDate: now,
        suggestedEndDate: oneMonthLater,
        importance: 'Important',
        // urgency: UrgencyLevel.Medium, // REMOVED - priority is now computed
        tags: [],
      },
      tokenUsage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      providerId: (provider as any).id || 'unknown',
      processingTimeMs: 0,
    };
  }
}
