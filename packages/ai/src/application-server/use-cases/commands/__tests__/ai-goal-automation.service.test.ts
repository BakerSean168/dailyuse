import { describe, expect, it, vi } from 'vitest';

import {
  AIProviderType,
  type GenerateGoalAutomationReq,
  type GoalAutomationExecutedAction,
} from '@dailyuse/contracts/ai';

import type { IAIProviderConfigRepository } from '../../../../domain-server/repositories/IAIProviderConfigRepository';
import type {
  AIExecutionLogInput,
  GoalAutomationExecutionInput,
  GoalAutomationPlanningInput,
  GoalAutomationPlanningResult,
  IAIExecutionLogPort,
  IAIAutomationToolExecutorPort,
  IGoalAutomationPlanningPort,
} from '../../../ports';
import { AIGoalAutomationService } from '../ai-goal-automation.service';

class StubProviderConfigRepository {
  async findById(id: string) {
    return id === 'provider-1'
      ? {
          id: 'provider-1',
          identityId: 'identity-1',
          providerType: AIProviderType.OpenAICompatible,
          baseUrl: 'https://api.openai.com/v1',
          apiKey: 'plain-secret',
          defaultModel: 'gpt-4o-mini',
          isActive: true,
          isDefault: true,
          name: 'Main provider',
        }
      : null;
  }

  async findDefaultByIdentityId(identityId: string) {
    return identityId === 'identity-1' ? this.findById('provider-1') : null;
  }

  async findByIdentityId(identityId: string) {
    const provider = await this.findDefaultByIdentityId(identityId);
    return provider ? [provider] : [];
  }
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
    keyResults: [
      {
        title: 'Expose confirmation UX',
        description: 'Users can approve the action plan.',
        targetValue: 1,
        unit: 'milestone',
      },
    ],
    taskTemplates: [
      {
        name: 'Review automation plan',
        description: 'Validate before side effects.',
        importance: 'Important',
        cadence: 'once',
      },
    ],
    actions: [
      { tool: 'create_goal', rationale: 'Create the target goal first.' },
      { tool: 'create_key_result', index: 0, rationale: 'Add the core outcome metric.' },
    ],
    usage: {
      promptTokens: 10,
      completionTokens: 12,
      totalTokens: 22,
    },
  }));
}

class StubAutomationToolExecutorPort implements IAIAutomationToolExecutorPort {
  public readonly executeGoalAutomation = vi.fn<
    (input: GoalAutomationExecutionInput) => Promise<GoalAutomationExecutedAction[]>
  >(async () => [
    {
      tool: 'create_goal',
      status: 'executed',
      entityId: 'IGoalId_00000000-0000-0000-0000-000000000001',
      message: 'Created goal "Ship AI automation"',
    },
  ]);
}

class StubExecutionLogPort implements IAIExecutionLogPort {
  public readonly record = vi.fn<(input: AIExecutionLogInput) => Promise<void>>(async () => {});
}

describe('AIGoalAutomationService', () => {
  it('plans without side effects until the user confirms execution', async () => {
    const planningPort = new StubGoalAutomationPlanningPort();
    const executorPort = new StubAutomationToolExecutorPort();
    const executionLogPort = new StubExecutionLogPort();
    const service = new AIGoalAutomationService(
      new StubProviderConfigRepository() as unknown as IAIProviderConfigRepository,
      planningPort,
      executorPort,
      executionLogPort,
    );

    const result = await service.automateGoal('identity-1', {
      idea: 'Finish the remaining AI automation flow with explicit approvals.',
      includeKeyResults: true,
      includeTaskTemplates: true,
      confirm: false,
    } satisfies GenerateGoalAutomationReq);

    expect(planningPort.plan).toHaveBeenCalledTimes(1);
    expect(planningPort.plan).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: expect.any(String),
        providerConfig: expect.objectContaining({
          model: 'gpt-4o-mini',
        }),
      }),
    );
    expect(executorPort.executeGoalAutomation).not.toHaveBeenCalled();
    expect(result.requiresConfirmation).toBe(true);
    expect(result.actions).toHaveLength(2);
    expect(executionLogPort.record).toHaveBeenCalledTimes(1);
    expect(executionLogPort.record).toHaveBeenCalledWith(
      expect.objectContaining({
        taskType: 'GOAL_AUTOMATION_PLAN',
        status: 'COMPLETED',
        providerId: 'provider-1',
        providerName: 'Main provider',
        model: 'gpt-4o-mini',
        requestId: expect.any(String),
      }),
    );
  });

  it('executes the approved plan without regenerating it', async () => {
    const planningPort = new StubGoalAutomationPlanningPort();
    const executorPort = new StubAutomationToolExecutorPort();
    const executionLogPort = new StubExecutionLogPort();
    const service = new AIGoalAutomationService(
      new StubProviderConfigRepository() as unknown as IAIProviderConfigRepository,
      planningPort,
      executorPort,
      executionLogPort,
    );

    const result = await service.automateGoal('identity-1', {
      idea: 'Finish the remaining AI automation flow with explicit approvals.',
      includeKeyResults: true,
      includeTaskTemplates: true,
      confirm: true,
      approvedSummary: 'Approved plan from the review step.',
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
        keyResults: [
          {
            title: 'Expose confirmation UX',
            description: 'Users can approve the action plan.',
            targetValue: 1,
            unit: 'milestone',
          },
        ],
        taskTemplates: [
          {
            name: 'Review automation plan',
            description: 'Validate before side effects.',
            importance: 'Important',
            cadence: 'once',
          },
        ],
      },
      approvedActions: [
        { tool: 'create_goal', rationale: 'Create the target goal first.' },
        { tool: 'create_key_result', index: 0, rationale: 'Add the core outcome metric.' },
      ],
    } satisfies GenerateGoalAutomationReq);

    expect(planningPort.plan).not.toHaveBeenCalled();
    expect(executorPort.executeGoalAutomation).toHaveBeenCalledTimes(1);
    expect(result.executedActions?.[0]?.tool).toBe('create_goal');
    expect(result.summary).toBe('Approved plan from the review step.');
    expect(result.tokenUsage.totalTokens).toBe(0);
    expect(executionLogPort.record).toHaveBeenCalledTimes(1);
    expect(executionLogPort.record).toHaveBeenCalledWith(
      expect.objectContaining({
        taskType: 'GOAL_AUTOMATION_EXECUTE',
        status: 'COMPLETED',
        providerId: 'provider-1',
        providerName: 'Main provider',
        model: 'gpt-4o-mini',
        requestId: expect.any(String),
      }),
    );
  });
});
