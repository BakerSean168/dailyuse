import { describe, expect, it, vi } from 'vitest';
import { GoalStatus, ReminderTriggerType } from '@memoflow/contracts/goal';
import { buildSchedulingKey } from '@memoflow/contracts/schedule';
import { createFixedClock, createTimeFacade } from '@memoflow/time';
import { createGoalScheduleProjectionSource } from './schedule-projection-source';

function goalDto(overrides: Record<string, unknown> = {}) {
  return {
    id: 'GoalId_goal-1',
    identityId: 'IdentityId_goal-owner',
    name: 'Launch 1.0',
    description: null,
    feasibilityAnalysis: null,
    motivation: null,
    status: GoalStatus.Active,
    startDate: Date.parse('2030-01-01T00:00:00.000Z'),
    dueDate: Date.parse('2030-01-20T00:00:00.000Z'),
    completedAt: null,
    archivedAt: null,
    sortOrder: 0,
    reminderConfig: {
      enabled: true,
      triggers: [{ enabled: true, type: ReminderTriggerType.RemainingDays, value: 7 }],
    },
    keyResults: null,
    weightSnapshots: null,
    goalReviews: null,
    version: 4,
    createdAt: 1,
    updatedAt: 2,
    deletedAt: null,
    ...overrides,
  };
}

function sourceFor(dto: ReturnType<typeof goalDto> | null) {
  const findByIdForIdentity = vi
    .fn()
    .mockResolvedValue(dto ? { toServerDTO: vi.fn().mockReturnValue(dto) } : null);
  const findAllGoalRefs = vi.fn().mockResolvedValue(
    dto ? [{ id: String(dto.id), identityId: String(dto.identityId) }] : [],
  );
  const time = createTimeFacade({
    clock: createFixedClock(Date.parse('2030-01-01T00:00:00.000Z')),
  });
  return {
    findByIdForIdentity,
    findAllGoalRefs,
    source: createGoalScheduleProjectionSource({
      goalRepository: { findByIdForIdentity, findAllGoalRefs } as never,
      time,
    }),
  };
}

describe('Goal due-date schedule projection -> ScheduledIntent', () => {
  it('fixture E: due date -7d emits exactly one stable neutral invocation', async () => {
    const fixture = sourceFor(goalDto());

    const first = await fixture.source.buildGoalPlan('GoalId_goal-1', 'IdentityId_goal-owner');
    const second = await fixture.source.buildGoalPlan('GoalId_goal-1', 'IdentityId_goal-owner');

    expect(fixture.findByIdForIdentity).toHaveBeenCalledWith(
      'IdentityId_goal-owner',
      'GoalId_goal-1',
      { includeChildren: true },
    );
    expect(first.owner).toEqual({
      identityId: 'IdentityId_goal-owner',
      type: 'goal',
      id: 'GoalId_goal-1',
    });
    expect(first.desired).toHaveLength(1);
    expect(first.desired[0]).toMatchObject({
      handlerKey: 'goal.reminder.fire',
      payloadVersion: 1,
      runAt: Date.parse('2030-01-13T00:00:00.000Z'),
      sourceRevision: '4',
      payload: {
        goalId: 'GoalId_goal-1',
        goalName: 'Launch 1.0',
        triggerType: ReminderTriggerType.RemainingDays,
        triggerValue: 7,
        dueDate: Date.parse('2030-01-20T00:00:00.000Z'),
        reminderTime: Date.parse('2030-01-13T00:00:00.000Z'),
      },
    });
    expect(first.desired[0]?.schedulingKey).toBe(
      buildSchedulingKey('goal.reminder', 'GoalId_goal-1', 'remaining-days:7'),
    );
    expect(second.desired[0]?.schedulingKey).toBe(first.desired[0]?.schedulingKey);
  });

  it('deduplicates identical reminder semantics and preserves independent trigger keys', async () => {
    const fixture = sourceFor(
      goalDto({
        reminderConfig: {
          enabled: true,
          triggers: [
            { enabled: true, type: ReminderTriggerType.RemainingDays, value: 7 },
            { enabled: true, type: ReminderTriggerType.RemainingDays, value: 7 },
            { enabled: true, type: ReminderTriggerType.TimeProgressPercentage, value: 50 },
          ],
        },
      }),
    );

    const plan = await fixture.source.buildGoalPlan('GoalId_goal-1', 'IdentityId_goal-owner');

    expect(plan.desired).toHaveLength(2);
    expect(new Set(plan.desired.map((intent) => intent.schedulingKey)).size).toBe(2);
  });

  it('returns empty desired set for non-active, archived, missing due-date, or missing Goal', async () => {
    for (const dto of [
      goalDto({ status: GoalStatus.Abandoned }),
      goalDto({ archivedAt: 10 }),
      goalDto({ dueDate: null }),
    ]) {
      const fixture = sourceFor(dto);
      expect(
        (await fixture.source.buildGoalPlan('GoalId_goal-1', 'IdentityId_goal-owner')).desired,
      ).toEqual([]);
    }

    const missing = sourceFor(null);
    expect(
      await missing.source.buildGoalPlan('GoalId_missing', 'IdentityId_goal-owner'),
    ).toEqual({
      owner: { identityId: 'IdentityId_goal-owner', type: 'goal', id: 'GoalId_missing' },
      desired: [],
    });
  });

  it('exposes authoritative Goal refs for startup lost-event repair', async () => {
    const fixture = sourceFor(goalDto());
    expect(await fixture.source.listGoalRefs?.()).toEqual([
      { goalId: 'GoalId_goal-1', identityId: 'IdentityId_goal-owner' },
    ]);
  });
});
