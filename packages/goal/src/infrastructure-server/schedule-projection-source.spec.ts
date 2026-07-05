import { describe, expect, it, vi } from 'vitest';
import { GoalStatus, ReminderTriggerType } from '@dailyuse/contracts/goal';
import { SourceModule } from '@dailyuse/contracts/schedule';
import { createGoalScheduleProjectionSource } from './schedule-projection-source';

describe('createGoalScheduleProjectionSource', () => {
  it('builds future schedule tasks for enabled goal reminder triggers', async () => {
    const now = new Date('2030-01-01T00:00:00.000Z').getTime();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const source = createGoalScheduleProjectionSource({
      goalRepository: {
        findById: vi.fn().mockResolvedValue({
          toServerDTO: vi.fn().mockReturnValue({
            id: 'GoalId_goal-1',
            identityId: 'IdentityId_goal-owner',
            name: 'Launch 1.0',
            importance: 'Important',
            status: GoalStatus.Active,
            archivedAt: null,
            completedAt: null,
            deletedAt: null,
            startDate: new Date('2030-01-10T00:00:00.000Z').getTime(),
            targetDate: new Date('2030-01-20T00:00:00.000Z').getTime(),
            reminderConfig: {
              enabled: true,
              triggers: [
                {
                  enabled: true,
                  type: ReminderTriggerType.RemainingDays,
                  value: 3,
                },
              ],
            },
          }),
        }),
      } as never,
    });

    const plan = await source.buildGoalPlan('GoalId_goal-1', 'IdentityId_goal-owner');

    expect(plan.selection.sourceModule).toBe(SourceModule.Goal);
    expect(plan.selection.sourceEntityId).toBe('GoalId_goal-1');
    expect(plan.nextTasks).toHaveLength(1);
    expect(plan.nextTasks[0]?.sourceEntityId).toBe('GoalId_goal-1');
    expect(plan.nextTasks[0]?.metadata.payload['triggerValue']).toBe(3);

    vi.useRealTimers();
  });
});
