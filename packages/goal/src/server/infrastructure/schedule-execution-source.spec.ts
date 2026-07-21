import { describe, expect, it, vi } from 'vitest';
import { SourceModule } from '@dailyuse/contracts/schedule';
import {
  NotificationCategory,
  NotificationChannelType,
  NotificationType,
  RelatedEntityType,
} from '@dailyuse/contracts/notification';
import { ScheduleTask } from '@dailyuse/schedule';
import { createGoalScheduleExecutionSource } from './schedule-execution-source';

function createScheduleTask(payload: Record<string, unknown> = {}) {
  return ScheduleTask.create({
    identityId: 'IdentityId_goal-owner',
    name: 'Goal Reminder',
    sourceModule: SourceModule.Goal,
    sourceEntityId: 'GoalId_goal-1',
    schedule: {
      cronExpression: null,
      timezone: 'Asia/Shanghai',
      startDate: new Date('2030-01-10T08:45:00.000Z').toISOString(),
      endDate: null,
      maxExecutions: 1,
    },
    metadata: {
      payload,
      tags: ['goal'],
      priority: 'Normal',
      timeout: null,
    },
  });
}

describe('createGoalScheduleExecutionSource', () => {
  it('builds a notification draft for active goal reminders', async () => {
    const findByIdForIdentity = vi.fn().mockResolvedValue({
      id: 'GoalId_goal-1',
      identityId: 'IdentityId_goal-owner',
      name: 'Ship R06',
      description: null,
      deletedAt: null,
      archivedAt: null,
      completedAt: null,
      status: 'Active',
      reminderConfig: { enabled: true },
    });
    const source = createGoalScheduleExecutionSource({
      goalRepository: {
        findById: vi.fn(),
        findByIdForIdentity,
      },
    });

    const task = createScheduleTask({
      triggerType: 'RemainingDays',
      triggerValue: 3,
    });
    const outcome = await source.executeGoal(task);

    expect(findByIdForIdentity).toHaveBeenCalledWith(
      String(task.identityId),
      'GoalId_goal-1',
      { includeChildren: true },
    );
    expect(outcome).toEqual({
      nextRunAt: null,
      notification: {
        identityId: 'IdentityId_goal-owner',
        title: '目标提醒：Ship R06',
        content: '目标「Ship R06」距离截止还有 3 天。',
        type: NotificationType.Reminder,
        category: NotificationCategory.Goal,
        relatedEntityType: RelatedEntityType.Goal,
        relatedEntityId: 'GoalId_goal-1',
        channels: [NotificationChannelType.InApp, NotificationChannelType.Push],
      },
      result: {
        goalId: 'GoalId_goal-1',
        goalTitle: 'Ship R06',
        triggerType: 'RemainingDays',
        triggerValue: 3,
      },
    });
  });
});
