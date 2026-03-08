import { GoalCategory, type GenerateGoalsReq, type GenerateGoalsRes } from '@dailyuse/contracts/ai';
import { ImportanceLevel } from '@dailyuse/contracts/shared';

export class GoalGenerationApplicationService {
  constructor(
    private readonly _validationService: unknown,
    private readonly providerConfigRepository: any,
    private readonly _quotaRepository: unknown,
    private readonly _quotaEnforcementService: unknown,
  ) {}

  async generateGoal(params: GenerateGoalsReq & { identityId: string }): Promise<GenerateGoalsRes> {
    const providers = await this.providerConfigRepository.findByIdentityId(params.identityId);
    const provider = providers.find((item: any) => item.isDefault) ?? providers[0];
    if (!provider) {
      throw new Error('No AI provider configured');
    }

    const now = Date.now();

    return {
      goal: {
        title: params.idea.slice(0, 50),
        description: params.idea,
        category: GoalCategory.OTHER,
        importance: ImportanceLevel.Moderate,
        tags: [],
        suggestedStartDate: now,
        suggestedEndDate: now + 30 * 24 * 60 * 60 * 1000,
      },
      keyResults: params.includeKeyResults
        ? [
            {
              title: 'Review AI goal draft',
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
      providerId: provider.id,
      processingTimeMs: 0,
      generatedAt: now,
      providerUsed: provider.name,
      modelUsed: provider.defaultModel ?? undefined,
    };
  }
}
