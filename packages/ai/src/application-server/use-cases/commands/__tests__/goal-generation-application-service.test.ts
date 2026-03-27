import { describe, expect, it, vi } from 'vitest';

import { AIProviderType } from '@dailyuse/contracts/ai';

import type {
  AIExecutionLogInput,
  GoalPlanningInput,
  GoalPlanningResult,
  IAIExecutionLogPort,
  IGoalPlanningPort,
} from '../../../ports';
import type { IAIProviderConfigRepository } from '../../../../domain-server/repositories/IAIProviderConfigRepository';
import { GoalGenerationApplicationService } from '../goal-generation-application-service';

class StubProviderConfigRepository {
  constructor(
    private readonly providers: Array<{
      id: string;
      identityId: string;
      providerType: string;
      baseUrl: string;
      apiKey: string;
      defaultModel: string | null;
      isActive: boolean;
      isDefault?: boolean;
      name: string;
    }>,
  ) {}

  async findById(id: string) {
    return this.providers.find((provider) => provider.id === id) ?? null;
  }

  async findDefaultByIdentityId(identityId: string) {
    return this.providers.find((provider) => provider.identityId === identityId && provider.isDefault) ?? null;
  }

  async findByIdentityId(identityId: string) {
    return this.providers.filter((provider) => provider.identityId === identityId);
  }
}

class StubGoalPlanningPort implements IGoalPlanningPort {
  public readonly plan = vi.fn<(input: GoalPlanningInput) => Promise<GoalPlanningResult>>(
    async () => ({
      goal: {
        title: 'Build a Python AI service',
        description: 'Refactor the Python service and document the architecture.',
        motivation: 'Reduce maintenance cost and make the system easier to extend.',
        category: 'learning',
        importance: 'Important',
        tags: ['python', 'ai', 'architecture'],
        feasibilityAnalysis: 'The scope fits into a focused refactor iteration.',
        aiInsights: 'Start with provider abstraction and stronger contracts.',
        suggestedStartDate: 1,
        suggestedEndDate: 2,
      },
      keyResults: [
        {
          title: 'Finish provider abstraction',
          description: 'Route AI calls through a shared execution port.',
          targetValue: 1,
          unit: 'milestone',
        },
      ],
      usage: {
      promptTokens: 40,
      completionTokens: 25,
      totalTokens: 65,
      },
    }),
  );
}

class StubExecutionLogPort implements IAIExecutionLogPort {
  public readonly record = vi.fn<(input: AIExecutionLogInput) => Promise<void>>(async () => {});
}

describe('GoalGenerationApplicationService', () => {
  it('generates a structured goal through the shared execution port', async () => {
    const executionPort = new StubGoalPlanningPort();
    const executionLogPort = new StubExecutionLogPort();
    const service = new GoalGenerationApplicationService(
      new StubProviderConfigRepository([
        {
          id: 'provider-foreign',
          identityId: 'someone-else',
          providerType: AIProviderType.OpenAICompatible,
          baseUrl: 'https://api.openai.com/v1',
          apiKey: 'foreign-secret',
          defaultModel: 'gpt-4o-mini',
          isActive: true,
          name: 'Foreign provider',
        },
        {
          id: 'provider-1',
          identityId: 'identity-1',
          providerType: AIProviderType.OpenAICompatible,
          baseUrl: 'https://api.openai.com/v1',
          apiKey: 'plain-secret',
          defaultModel: 'gpt-4o-mini',
          isActive: true,
          isDefault: true,
          name: 'Main provider',
        },
      ]) as unknown as IAIProviderConfigRepository,
      executionPort,
      executionLogPort,
    );

    const result = await service.generateGoal({
      identityId: 'identity-1',
      idea: 'Use Python engineering best practices to improve the internal ai-service module.',
      providerId: 'provider-foreign',
      timeframe: 'three weeks',
      includeKeyResults: true,
    });

    expect(executionPort.plan).toHaveBeenCalledWith({
      identityId: 'identity-1',
      providerConfig: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        apiKey: 'plain-secret',
        baseUrl: 'https://api.openai.com/v1',
        temperature: 0.3,
        maxTokens: undefined,
      },
      idea: 'Use Python engineering best practices to improve the internal ai-service module.',
      category: undefined,
      timeframe: 'three weeks',
      includeKeyResults: true,
      requestId: expect.any(String),
    });

    expect(result.goal.title).toBe('Build a Python AI service');
    expect(result.goal.category).toBe('learning');
    expect(result.goal.importance).toBe('Important');
    expect(result.keyResults).toEqual([
      {
        title: 'Finish provider abstraction',
        description: 'Route AI calls through a shared execution port.',
        targetValue: 1,
        unit: 'milestone',
      },
    ]);
    expect(result.providerId).toBe('provider-1');
    expect(result.tokenUsage.totalTokens).toBe(65);
    expect(executionLogPort.record).toHaveBeenCalledWith(
      expect.objectContaining({
        taskType: 'GOAL_GENERATION',
        status: 'COMPLETED',
        providerId: 'provider-1',
        providerName: 'Main provider',
        model: 'gpt-4o-mini',
        requestId: expect.any(String),
        costEstimate: expect.objectContaining({
          pricingModel: 'gpt-4o-mini',
          totalCostUsd: expect.any(Number),
        }),
      }),
    );
  });
});
