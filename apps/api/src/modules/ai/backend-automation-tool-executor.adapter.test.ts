import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ok } from '@dailyuse/contracts/result';
import type { GoalAutomationExecutionInput } from '@dailyuse/ai/ports';

import { BackendAutomationToolExecutorAdapter } from './backend-automation-tool-executor.adapter';

const mocks = vi.hoisted(() => ({
  createGoal: vi.fn(),
  addKeyResult: vi.fn(),
  createTaskTemplate: vi.fn(),
  createReminderTemplate: vi.fn(),
  listRelevantResources: vi.fn(),
  buildContext: vi.fn(),
}));

vi.mock('@dailyuse/goal/api', () => ({
  createGoalPrismaModule: vi.fn(() => ({
    api: {
      createGoal: mocks.createGoal,
      addKeyResult: mocks.addKeyResult,
    },
  })),
}));

vi.mock('@dailyuse/task/api', () => ({
  createTaskPrismaModule: vi.fn(() => ({
    api: {
      createTaskTemplate: mocks.createTaskTemplate,
    },
  })),
}));

vi.mock('@dailyuse/reminder/api', () => ({
  createReminderPrismaModule: vi.fn(() => ({
    api: {
      createTemplate: mocks.createReminderTemplate,
    },
  })),
}));

vi.mock('./repository-knowledge-source.adapter', () => ({
  RepositoryKnowledgeSourceAdapter: vi.fn(function RepositoryKnowledgeSourceAdapter() {
    return {
      listRelevantResources: mocks.listRelevantResources,
    };
  }),
}));

vi.mock('./controlled-analytics-read.adapter', () => ({
  ControlledAnalyticsReadAdapter: vi.fn(function ControlledAnalyticsReadAdapter() {
    return {
      buildContext: mocks.buildContext,
    };
  }),
}));

function createExecutionInput(): GoalAutomationExecutionInput {
  return {
    identityId: 'identity-1',
    request: {
      idea: 'Create a goal with a custom measurable key result.',
    },
    plan: {
      goal: {
        title: 'Ship Agent workflow',
        description: 'Move the Agent workflow from spike to controlled execution.',
        category: 'work' as GoalAutomationExecutionInput['plan']['goal']['category'],
        suggestedStartDate: 1_000,
        suggestedEndDate: 2_000,
        importance: 'Important' as GoalAutomationExecutionInput['plan']['goal']['importance'],
        tags: ['agent'],
      },
      keyResults: [
        {
          title: 'Complete verified executor path',
          description: 'Custom KR fields should survive approved execution.',
          valueType: 'Absolute',
          calculationMethod: 'Max',
          startValue: 2,
          currentValue: 4,
          targetValue: 10,
          unit: 'checks',
          weight: 5,
        },
      ],
      taskTemplates: [
        {
          name: 'Review Agent executor progress',
          description: 'Verify the matching KR every week.',
          importance: 'Moderate',
          cadence: 'weekly',
        },
      ],
      reminders: [
        {
          title: 'Weekly Agent review',
          description: 'Review goal progress and choose the next focus.',
          importance: 'Moderate',
          cadence: 'weekly',
          timeOfDay: '10:30',
        },
      ],
    },
    actions: [
      { tool: 'create_goal', index: 0 },
      { tool: 'create_key_result', index: 0 },
      { tool: 'create_task_template', index: 0 },
      { tool: 'create_reminder', index: 0 },
    ],
  };
}

describe('BackendAutomationToolExecutorAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createGoal.mockResolvedValue(ok({ id: 'goal-1', name: 'Ship Agent workflow' }));
    mocks.addKeyResult.mockResolvedValue(
      ok({ id: 'key-result-1', title: 'Complete verified executor path' }),
    );
    mocks.createTaskTemplate.mockResolvedValue(
      ok({
        template: {
          id: 'task-template-1',
          name: 'Review Agent executor progress',
        },
        instanceCount: 0,
      }),
    );
    mocks.createReminderTemplate.mockResolvedValue(
      ok({
        id: 'reminder-template-1',
        name: 'Weekly Agent review',
      }),
    );
  });

  it('executes approved goal, key result, task template, and reminder drafts with their reviewed fields', async () => {
    const adapter = new BackendAutomationToolExecutorAdapter(
      {} as ConstructorParameters<typeof BackendAutomationToolExecutorAdapter>[0],
      'storage',
    );
    const now = new Date('2026-06-10T01:00:00.000Z').getTime();
    const expectedReminderStart = new Date(now);
    expectedReminderStart.setHours(10, 30, 0, 0);
    if (expectedReminderStart.getTime() < now) {
      expectedReminderStart.setDate(expectedReminderStart.getDate() + 1);
    }
    const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(now);

    try {
      const result = await adapter.executeGoalAutomation(createExecutionInput());

      expect(result.map((action) => action.tool)).toEqual([
        'create_goal',
        'create_key_result',
        'create_task_template',
        'create_reminder',
      ]);
      expect(result.every((action) => action.status === 'executed')).toBe(true);
      expect(mocks.addKeyResult).toHaveBeenCalledWith('goal-1', {
        title: 'Complete verified executor path',
        valueType: 'Absolute',
        aggregationMethod: 'Max',
        startValue: 2,
        currentValue: 4,
        targetValue: 10,
        unit: 'checks',
        weight: 5,
      });
      expect(mocks.createTaskTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          identityId: 'identity-1',
          name: 'Review Agent executor progress',
          goalBinding: expect.objectContaining({
            goalId: 'goal-1',
            keyResultId: 'key-result-1',
            goalRecordValue: 1,
          }),
        }),
      );
      expect(mocks.createReminderTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Weekly Agent review',
          description: 'Review goal progress and choose the next focus.',
          type: 'Recurring',
          trigger: expect.objectContaining({
            type: 'Interval',
            interval: expect.objectContaining({
              minutes: 10_080,
              startTime: expectedReminderStart.getTime(),
            }),
          }),
          activeTime: expect.objectContaining({
            startDate: expectedReminderStart.getTime(),
          }),
          notificationConfig: expect.objectContaining({
            channels: ['InApp'],
            title: 'Weekly Agent review',
            body: 'Review goal progress and choose the next focus.',
          }),
          importanceLevel: 'Moderate',
          tags: ['goal-agent'],
        }),
        { identityId: 'identity-1' },
      );
    } finally {
      dateNowSpy.mockRestore();
    }
  });

  it('skips dependent actions when goal creation fails', async () => {
    mocks.createGoal.mockRejectedValueOnce(new Error('Goal service unavailable'));
    const adapter = new BackendAutomationToolExecutorAdapter(
      {} as ConstructorParameters<typeof BackendAutomationToolExecutorAdapter>[0],
      'storage',
    );

    const result = await adapter.executeGoalAutomation(createExecutionInput());

    expect(result).toEqual([
      {
        tool: 'create_goal',
        status: 'failed',
        message: 'Goal service unavailable',
      },
      {
        tool: 'create_key_result',
        status: 'skipped',
        message: 'Skipped because goal creation failed.',
      },
      {
        tool: 'create_task_template',
        status: 'skipped',
        message: 'Skipped because goal creation failed.',
      },
      {
        tool: 'create_reminder',
        status: 'skipped',
        message: 'Skipped because goal creation failed.',
      },
    ]);
    expect(mocks.addKeyResult).not.toHaveBeenCalled();
    expect(mocks.createTaskTemplate).not.toHaveBeenCalled();
    expect(mocks.createReminderTemplate).not.toHaveBeenCalled();
  });
});
