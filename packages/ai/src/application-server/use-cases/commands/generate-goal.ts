/**
 * Generate Goal Service
 *
 * AI 生成目标应用服务
 */

import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/IAIProviderConfigRepository';
import type { GenerateGoalsReq, GenerateGoalsRes } from '@dailyuse/contracts/ai';
import { GoalCategory } from '@dailyuse/contracts/ai';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
// import { AIContainer } from '@dailyuse/ai/infrastructure-server';

/**
 * Generate Goal Service
 */
export class GenerateGoal {
  constructor(private readonly providerRepository: IAIProviderConfigRepository) {}

  async execute(identityId: string, input: GenerateGoalsReq): Promise<GenerateGoalsRes> {
    const providers = await this.providerRepository.findByIdentityId(identityId);
    const provider = providers.find((p: any) => p.isDefault) || providers[0];
    if (!provider) {
      throw new Error('No AI provider configured');
    }

    const now = Date.now();
    const oneMonthLater = now + 30 * 24 * 60 * 60 * 1000;
    const idea = input.idea.trim();

    return {
      goal: {
        title: `Goal: ${idea.substring(0, 50)}`,
        description: `AI generated goal based on: ${idea}`,
        motivation: 'AI generated motivation',
        category: GoalCategory.OTHER,
        suggestedStartDate: now,
        suggestedEndDate: oneMonthLater,
        importance: ImportanceLevel.Moderate,
        tags: [],
      },
      keyResults: input.includeKeyResults
        ? [
            {
              title: 'Validate draft',
              description: 'Review and adjust the generated goal details',
              targetValue: 1,
              unit: 'draft',
            },
          ]
        : undefined,
      tokenUsage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      providerId: (provider as any).id || 'unknown',
      processingTimeMs: 0,
      generatedAt: now,
    };
  }
}
