import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ok } from '@memoflow/contracts/result';
import type { GoalAutomationExecutionInput } from '@memoflow/ai/ports';

import { BackendAutomationToolExecutorAdapter } from './backend-automation-tool-executor.adapter';

const mocks = vi.hoisted(() => ({
  createGoal: vi.fn(),
  createTaskTemplate: vi.fn(),
  createReminderTemplate: vi.fn(),
  listRelevantNotes: vi.fn(),
  buildContext: vi.fn(),
}));

vi.mock('@memoflow/goal', () => ({
  createGoalPrismaModule: vi.fn(() => ({
    api: {
      createGoal: mocks.createGoal,
    },
  })),
}));

vi.mock('@memoflow/task', () => ({
  createTaskPrismaModule: vi.fn(() => ({
    api: {
      createTaskTemplate: mocks.createTaskTemplate,
    },
  })),
  PrismaTaskBindingReadPort: class {
    constructor() {}
    checkActiveTaskBindings = vi.fn().mockResolvedValue({ hasActiveBindings: false, activeCount: 0 });
  },
}));

vi.mock('@memoflow/reminder', () => ({
  createReminderPrismaModule: vi.fn(() => ({
    api: {
      createTemplate: mocks.createReminderTemplate,
    },
  })),
}));

vi.mock('./repository-knowledge-source.adapter', () => ({
  RepositoryKnowledgeSourceAdapter: vi.fn(function RepositoryKnowledgeSourceAdapter() {
    return {
      listRelevantNotes: mocks.listRelevantNotes,
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
    mocks.createGoal.mockResolvedValue(
      ok({
        goalId: 'goal-1',
        goalVersion: 1,
        affectedIds: ['goal-1', 'key-result-1'],
        readModel: {
          id: 'goal-1',
          name: 'Ship Agent workflow',
          keyResults: [{ id: 'key-result-1', title: 'Complete verified executor path' }],
        },
      }),
    );
    mocks.createTaskTemplate.mockResolvedValue(
      ok({
        template: {
          id: 'task-template-1',
          name: 'Review Agent executor progress',
        },
        instanceCount: 0,
        todayInstanceCreated: false,
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
      expect(mocks.createGoal).toHaveBeenCalledWith(
        expect.objectContaining({
          initialKeyResults: [
            {
              title: 'Complete verified executor path',
              valueType: 'Absolute',
              calculationMethod: 'Max',
              startValue: 2,
              currentValue: 4,
              targetValue: 10,
              unit: 'checks',
              weight: 5,
            },
          ],
        }),
        { identityId: 'identity-1' },
      );
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
            // Residual 835/1331: ActiveTime uses activatedAt sole (startDate dual retired).
            activatedAt: expectedReminderStart.getTime(),
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
    expect(mocks.createTaskTemplate).not.toHaveBeenCalled();
    expect(mocks.createReminderTemplate).not.toHaveBeenCalled();
  });

  it('closureChecker blocks when account closure operation is requested or revoking or closing', async () => {
    let passedClosureChecker: ((identityId: string) => Promise<boolean>) | undefined;
    const { createReminderPrismaModule } = await import('@memoflow/reminder');
    vi.mocked(createReminderPrismaModule).mockImplementationOnce((_db, options: any) => {
      passedClosureChecker = options?.closureChecker;
      return {
        api: {
          createTemplate: mocks.createReminderTemplate,
        },
      } as any;
    });

    const mockDb = {
      account: {
        findUnique: vi.fn().mockResolvedValue({ status: 'Active' }),
      },
      accountClosureOperation: {
        findFirst: vi.fn().mockResolvedValue({ id: 'op-1', phase: 'requested' }),
      },
    };

    new BackendAutomationToolExecutorAdapter(mockDb as any, 'storage');
    expect(passedClosureChecker).toBeDefined();

    const isBlocked = await passedClosureChecker!('identity-closing');
    expect(isBlocked).toBe(true);
    expect(mockDb.accountClosureOperation.findFirst).toHaveBeenCalledWith({
      where: {
        identityId: 'identity-closing',
        phase: { in: ['requested', 'revoking', 'closing'] },
      },
    });
  });
});
