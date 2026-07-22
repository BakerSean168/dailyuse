import { describe, expect, it, vi } from 'vitest';

import { AIProviderType } from '@dailyuse/contracts/ai';

import type {
  AIExecutionLogInput,
  GoalAutomationExecutionInput,
  GoalAutomationPlanningInput,
  GoalAutomationPlanningResult,
  IAIAutomationToolExecutorPort,
  GoalPlanningInput,
  GoalPlanningResult,
  IAIExecutionLogPort,
  IAnalyticsReadPort,
  IGoalAutomationPlanningPort,
  IGoalPlanningPort,
  IKnowledgeSourcePort,
  KnowledgeSourceResource,
} from '../../../ports';
import type { IAIProviderConfigRepository } from '../../../../domain/repositories/i-ai-provider-config-repository';
import { GenerateAIGoalUseCase } from '../generate-ai-goal.use-case';

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

  async findByIdForIdentity(identityId: string, id: string) {
    const provider = this.providers.find((item) => item.id === id) ?? null;
    if (!provider || provider.identityId !== identityId) {
      return null;
    }
    return provider;
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
      state: 'draft',
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
          valueType: 'Incremental',
          calculationMethod: 'Sum',
          startValue: 0,
          currentValue: 0,
          targetValue: 1,
          unit: 'milestone',
          weight: 1,
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

class StubGoalAutomationPlanningPort implements IGoalAutomationPlanningPort {
  public readonly plan = vi.fn<
    (input: GoalAutomationPlanningInput) => Promise<GoalAutomationPlanningResult>
  >(async () => ({
    summary: 'Drafted a practical execution plan.',
    goal: {
      title: 'Ship AI automation',
      description: 'Wire explicit tool calls into the product.',
      motivation: 'Reduce manual setup work.',
      category: 'work',
      importance: 'Important',
      tags: ['ai', 'automation'],
      feasibilityAnalysis: 'Fits the current iteration.',
      aiInsights: 'Start with auditable tool execution.',
      suggestedStartDate: 1,
      suggestedEndDate: 2,
    },
    keyResults: [],
    taskTemplates: [],
    actions: [{ tool: 'create_goal', rationale: 'Create the target goal first.' }],
    usage: {
      promptTokens: 12,
      completionTokens: 6,
      totalTokens: 18,
    },
  }));
}

class StubAutomationToolExecutorPort implements IAIAutomationToolExecutorPort {
  public readonly executeGoalAutomation = vi.fn<
    (input: GoalAutomationExecutionInput) => Promise<
      Array<{
        tool: 'create_goal';
        status: 'executed';
        entityId: string;
        message: string;
      }>
    >
  >(async () => [
    {
      tool: 'create_goal',
      status: 'executed',
      entityId: 'goal-123',
      message: 'Created goal "Ship AI automation"',
    },
  ]);
}

class StubKnowledgeSourcePort implements IKnowledgeSourcePort {
  public readonly listRelevantResources = vi.fn<
    (identityId: string, query: string, limit: number) => Promise<KnowledgeSourceResource[]>
  >(async () => [
    {
      identityId: 'identity-1',
      repositoryId: 'repo-1',
      resourceId: 'resource-1',
      resourcePath: 'notes/ai-goals.md',
      title: 'AI Goal Notes',
      mimeType: 'text/markdown',
      content: 'Keep goal setup auditable and approval-first.',
      metadata: { source: 'test' },
    },
  ]);

  public readonly listIndexableResources = vi.fn(async () => []);

  public readonly getResourceById = vi.fn(async () => null);
}

class StubAnalyticsReadPort implements IAnalyticsReadPort {
  public readonly buildContext = vi.fn(async () => ({
    dashboard: { stats: { activeGoals: 3, completedToday: 1 } },
    taskDashboard: { summary: { totalTasks: 7, overdue: 1 } },
    goals: [{ id: 'goal-1', title: 'Ship AI automation' }],
    goalSearchResults: [],
    extra: { source: 'test' },
  }));
}

describe('GoalGenerationApplicationService', () => {
  it('generates a structured goal through the shared execution port', async () => {
    const executionPort = new StubGoalPlanningPort();
    const executionLogPort = new StubExecutionLogPort();
    const service = new GenerateAIGoalUseCase(
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
      undefined,
      undefined,
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
      clarificationAnswers: undefined,
      requestId: expect.any(String),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.data.state).toBe('draft');
    if (result.data.state !== 'draft') {
      throw new Error('expected draft state');
    }
    expect(result.data.goal.title).toBe('Build a Python AI service');
    expect(result.data.goal.category).toBe('learning');
    expect(result.data.goal.importance).toBe('Important');
    expect(result.data.keyResults).toEqual([
      {
        title: 'Finish provider abstraction',
        description: 'Route AI calls through a shared execution port.',
        valueType: 'Incremental',
        calculationMethod: 'Sum',
        startValue: 0,
        currentValue: 0,
        targetValue: 1,
        unit: 'milestone',
        weight: 1,
      },
    ]);
    expect(result.data.providerId).toBe('provider-1');
    expect(result.data.tokenUsage.totalTokens).toBe(65);
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

  it('records failed executions when goal planning rejects', async () => {
    const executionPort = new StubGoalPlanningPort();
    const executionLogPort = new StubExecutionLogPort();
    vi.mocked(executionPort.plan).mockRejectedValueOnce(new Error('planning exploded'));
    const service = new GenerateAIGoalUseCase(
      new StubProviderConfigRepository([
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
      undefined,
      undefined,
      executionLogPort,
    );

    const result = await service.generateGoal({
      identityId: 'identity-1',
      idea: 'Use Python engineering best practices to improve the internal ai-service module.',
      timeframe: 'three weeks',
      includeKeyResults: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('planning exploded');
    }

    expect(executionLogPort.record).toHaveBeenCalledWith(
      expect.objectContaining({
        taskType: 'GOAL_GENERATION',
        status: 'FAILED',
        providerId: 'provider-1',
        providerName: 'Main provider',
        model: 'gpt-4o-mini',
        requestId: expect.any(String),
        error: 'planning exploded',
      }),
    );
  });

  it('returns clarification state when the planning port asks follow-up questions', async () => {
    const executionPort = new StubGoalPlanningPort();
    const executionLogPort = new StubExecutionLogPort();
    vi.mocked(executionPort.plan).mockResolvedValueOnce({
      state: 'clarification',
      clarification: {
        needsClarification: true,
        rationale: 'The idea is still missing scope and timeline.',
        questions: [
          {
            question: 'What concrete outcome do you want?',
            context: 'This anchors the goal definition.',
          },
          {
            question: 'What timeline are you targeting?',
            context: 'This sets the suggested end date.',
          },
        ],
      },
      usage: {
        promptTokens: 18,
        completionTokens: 9,
        totalTokens: 27,
      },
    });
    const service = new GenerateAIGoalUseCase(
      new StubProviderConfigRepository([
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
      undefined,
      undefined,
      executionLogPort,
    );

    const result = await service.generateGoal({
      identityId: 'identity-1',
      idea: 'I want to get better at AI.',
      clarificationAnswers: ['Python backend', 'within 3 months'],
    });

    expect(executionPort.plan).toHaveBeenCalledWith(
      expect.objectContaining({
        clarificationAnswers: ['Python backend', 'within 3 months'],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.data).toEqual(
      expect.objectContaining({
        state: 'clarification',
        clarification: expect.objectContaining({
          needsClarification: true,
        }),
      }),
    );
    expect(executionLogPort.record).toHaveBeenCalledWith(
      expect.objectContaining({
        result: {
          state: 'clarification',
          clarificationQuestionCount: 2,
        },
      }),
    );
  });

  it('returns a confirm state for goal automation planning through the unified workflow', async () => {
    const executionLogPort = new StubExecutionLogPort();
    const automationPlanningPort = new StubGoalAutomationPlanningPort();
    const automationExecutorPort = new StubAutomationToolExecutorPort();
    const knowledgeSourcePort = new StubKnowledgeSourcePort();
    const analyticsReadPort = new StubAnalyticsReadPort();
    const service = new GenerateAIGoalUseCase(
      new StubProviderConfigRepository([
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
      new StubGoalPlanningPort(),
      automationPlanningPort,
      automationExecutorPort,
      executionLogPort,
      knowledgeSourcePort,
      analyticsReadPort,
    );

    const result = await service.generateGoal({
      identityId: 'identity-1',
      command: 'prepare',
      idea: 'Plan automation for this goal workflow.',
      draftContext: {
        goal: {
          title: 'Ship AI automation',
          description: 'Unify chat and goal automation.',
          category: 'work',
          importance: 'Important',
          tags: ['ai'],
        },
        keyResults: [
          {
            title: 'Expose confirmation UX',
            description: 'Users can approve the action plan.',
            valueType: 'Incremental',
            calculationMethod: 'Sum',
            startValue: 0,
            currentValue: 0,
            targetValue: 1,
            unit: 'milestone',
            weight: 1,
          },
        ],
      },
      includeTaskTemplates: true,
    });

    expect(automationPlanningPort.plan).toHaveBeenCalledWith(
      expect.objectContaining({
        idea: expect.stringContaining('Goal title: Ship AI automation'),
        includeTaskTemplates: true,
        relatedResources: [
          expect.objectContaining({
            resourceId: 'resource-1',
            resourcePath: 'notes/ai-goals.md',
          }),
        ],
        analyticsContext: expect.objectContaining({
          dashboard: expect.objectContaining({
            stats: expect.objectContaining({
              activeGoals: 3,
            }),
          }),
        }),
      }),
    );
    expect(knowledgeSourcePort.listRelevantResources).toHaveBeenCalledWith(
      'identity-1',
      expect.stringContaining('Goal title: Ship AI automation'),
      6,
    );
    expect(analyticsReadPort.buildContext).toHaveBeenCalledWith(
      'identity-1',
      expect.stringContaining('Goal title: Ship AI automation'),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.data.state).toBe('confirm');
    if (result.data.state !== 'confirm') {
      throw new Error('expected confirm state');
    }
    expect(result.data.summary).toBe('Drafted a practical execution plan.');
    expect(result.data.actions).toHaveLength(1);
    expect(automationExecutorPort.executeGoalAutomation).not.toHaveBeenCalled();
  });

  it('executes an approved automation plan through the unified workflow', async () => {
    const executionLogPort = new StubExecutionLogPort();
    const automationPlanningPort = new StubGoalAutomationPlanningPort();
    const automationExecutorPort = new StubAutomationToolExecutorPort();
    const service = new GenerateAIGoalUseCase(
      new StubProviderConfigRepository([
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
      new StubGoalPlanningPort(),
      automationPlanningPort,
      automationExecutorPort,
      executionLogPort,
    );

    const result = await service.generateGoal({
      identityId: 'identity-1',
      command: 'execute',
      idea: 'Execute the approved plan.',
      approvedSummary: 'Approved plan from review.',
      approvedPlan: {
        goal: {
          title: 'Ship AI automation',
          description: 'Wire explicit tool calls into the product.',
          motivation: 'Reduce manual setup work.',
          category: 'work',
          importance: 'Important',
          tags: ['ai', 'automation'],
          feasibilityAnalysis: 'Fits the current iteration.',
          aiInsights: 'Start with auditable tool execution.',
          suggestedStartDate: 1,
          suggestedEndDate: 2,
        },
        keyResults: [],
        taskTemplates: [],
      },
      approvedActions: [{ tool: 'create_goal', rationale: 'Create the target goal first.' }],
    });

    expect(automationPlanningPort.plan).not.toHaveBeenCalled();
    expect(automationExecutorPort.executeGoalAutomation).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.data.state).toBe('result');
    if (result.data.state !== 'result') {
      throw new Error('expected result state');
    }
    expect(result.data.executedActions[0]?.entityId).toBe('goal-123');
    expect(result.data.summary).toBe('Approved plan from review.');
    expect(result.data.executionSummary).toEqual({
      status: 'success',
      executedCount: 1,
      skippedCount: 0,
      failedCount: 0,
    });
    expect(result.data.recovery).toEqual({
      canRetry: false,
      failedActions: [],
      suggestions: [],
    });
  });

  it('returns partial execution metadata and recovery suggestions when some actions fail', async () => {
    const executionLogPort = new StubExecutionLogPort();
    const automationExecutorPort = new StubAutomationToolExecutorPort();
    vi.mocked(automationExecutorPort.executeGoalAutomation).mockResolvedValueOnce([
      {
        tool: 'create_goal',
        status: 'executed',
        entityId: 'goal-123',
        message: 'Created goal "Ship AI automation"',
      },
      {
        tool: 'create_key_result',
        status: 'failed',
        message: 'Missing key result draft for index 0',
      },
    ]);
    const service = new GenerateAIGoalUseCase(
      new StubProviderConfigRepository([
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
      new StubGoalPlanningPort(),
      new StubGoalAutomationPlanningPort(),
      automationExecutorPort,
      executionLogPort,
    );

    const result = await service.generateGoal({
      identityId: 'identity-1',
      command: 'execute',
      idea: 'Execute the approved plan with a recoverable failure.',
      approvedSummary: 'Approved plan from review.',
      approvedPlan: {
        goal: {
          title: 'Ship AI automation',
          description: 'Wire explicit tool calls into the product.',
          motivation: 'Reduce manual setup work.',
          category: 'work',
          importance: 'Important',
          tags: ['ai', 'automation'],
          feasibilityAnalysis: 'Fits the current iteration.',
          aiInsights: 'Start with auditable tool execution.',
          suggestedStartDate: 1,
          suggestedEndDate: 2,
        },
        keyResults: [],
        taskTemplates: [],
      },
      approvedActions: [
        { tool: 'create_goal', rationale: 'Create the target goal first.' },
        { tool: 'create_key_result', index: 0, rationale: 'Create the key result next.' },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.data.state).toBe('result');
    if (result.data.state !== 'result') {
      throw new Error('expected result state');
    }
    expect(result.data.executionSummary).toEqual({
      status: 'partial',
      executedCount: 1,
      skippedCount: 0,
      failedCount: 1,
    });
    expect(result.data.recovery.canRetry).toBe(true);
    expect(result.data.recovery.failedActions).toEqual([
      expect.objectContaining({
        tool: 'create_key_result',
        status: 'failed',
      }),
    ]);
    expect(result.data.recovery.suggestions).toContain(
      'Confirm the goal exists and the key result drafts are complete before retrying execution.',
    );
  });

  it('reuses a caller-provided request id for downstream goal planning calls', async () => {
    const executionPort = new StubGoalPlanningPort();
    const executionLogPort = new StubExecutionLogPort();
    const service = new GenerateAIGoalUseCase(
      new StubProviderConfigRepository([
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
      undefined,
      undefined,
      executionLogPort,
    );

    await service.generateGoal({
      identityId: 'identity-1',
      requestId: 'trace-goal-application-1',
      idea: 'Use Python engineering best practices to improve the internal ai-service module.',
      timeframe: 'three weeks',
      includeKeyResults: true,
    });

    expect(executionPort.plan).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'trace-goal-application-1',
      }),
    );
    expect(executionLogPort.record).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'trace-goal-application-1',
      }),
    );
  });
});
