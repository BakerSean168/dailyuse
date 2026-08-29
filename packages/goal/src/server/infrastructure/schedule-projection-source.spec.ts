import { describe, expect, it, vi } from 'vitest';
import {
  GOAL_REMINDER_HANDLER_KEY,
  GOAL_REMINDER_PAYLOAD_VERSION,
  createGoalScheduleProjectionSource,
  goalScheduleProjectionEventNames,
} from './schedule-projection-source';
import { buildSchedulingKey } from '@memoflow/contracts/schedule';
import { GoalStatus, ReminderTriggerType } from '@memoflow/contracts/goal';
import { defaultTime } from '@memoflow/time';

type GoalDto = {
  id: string;
  identityId: string;
  name: string;
  status: GoalStatus;
  archivedAt: number | null;
  completedAt: number | null;
  deletedAt: number | null;
  startDate: number | null;
  dueDate: number | null;
  reminderConfig: {
    enabled: boolean;
    triggers: Array<{ enabled: boolean; type: ReminderTriggerType; value: number }>;
  } | null;
  version: number;
};

function buildGoalDto(overrides: Partial<GoalDto> = {}): GoalDto {
  return {
    id: 'GoalId_goal-1',
    identityId: 'IdentityId_goal-owner',
    name: 'Launch 1.0',
    status: GoalStatus.Active,
    archivedAt: null,
    completedAt: null,
    deletedAt: null,
    startDate: new Date('2030-01-10T00:00:00.000Z').getTime(),
    dueDate: new Date('2030-01-20T00:00:00.000Z').getTime(),
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
    version: 3,
    ...overrides,
  };
}

function createSource(goalRepository: Record<string, unknown>) {
  return createGoalScheduleProjectionSource({
    goalRepository: goalRepository as never,
  });
}

describe('createGoalScheduleProjectionSource', () => {
  // Fixture E: a Goal due-date reminder (-7d) projects exactly one stable invocation.
  it('projects one stable -7d RemainingDays reminder through the neutral scheduling identity', async () => {
    const now = new Date('2030-01-01T00:00:00.000Z').getTime();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const goalDto = buildGoalDto({
      dueDate: new Date('2030-01-20T00:00:00.000Z').getTime(),
      reminderConfig: {
        enabled: true,
        triggers: [{ enabled: true, type: ReminderTriggerType.RemainingDays, value: 7 }],
      },
    });
    const goalAggregate = {
      toServerDTO: vi.fn().mockReturnValue(goalDto),
    };
    const findByIdForIdentity = vi.fn().mockResolvedValue(goalAggregate);
    const source = createSource({ findByIdForIdentity });

    const plan = await source.buildGoalPlan('GoalId_goal-1', 'IdentityId_goal-owner');
    const again = await source.buildGoalPlan('GoalId_goal-1', 'IdentityId_goal-owner');

    expect(findByIdForIdentity).toHaveBeenCalledWith('IdentityId_goal-owner', 'GoalId_goal-1', {
      includeChildren: true,
    });
    expect(goalAggregate.toServerDTO).toHaveBeenCalledWith(true);

    expect(plan.owner).toEqual({
      identityId: 'IdentityId_goal-owner',
      type: 'goal.goal',
      id: 'GoalId_goal-1',
    });
    expect(plan.desired).toHaveLength(1);

    const expectedRunAt = defaultTime.calendar.addDays(goalDto.dueDate as number, -7);
    const intent = plan.desired[0];
    expect(intent?.handlerKey).toBe(GOAL_REMINDER_HANDLER_KEY);
    expect(intent?.payloadVersion).toBe(GOAL_REMINDER_PAYLOAD_VERSION);
    expect(intent?.runAt).toBe(expectedRunAt);
    expect(intent?.priority).toBe('normal');
    expect(intent?.payload).toEqual({
      goalId: 'GoalId_goal-1',
      goalTitle: 'Launch 1.0',
      triggerType: ReminderTriggerType.RemainingDays,
      triggerValue: 7,
      startDate: goalDto.startDate,
      dueDate: goalDto.dueDate,
      reminderTime: expectedRunAt,
    });
    expect(intent?.sourceRevision).toBe('3');
    expect(intent?.observability?.name).toBe('Launch 1.0 · 剩余 7 天提醒');

    const expectedKey = buildSchedulingKey('goal.reminder', 'GoalId_goal-1', 'remaining:7');
    expect(intent?.schedulingKey).toBe(expectedKey);
    expect(again.desired.map((item) => item.schedulingKey)).toEqual([expectedKey]);

    vi.useRealTimers();
  });

  it('projects a TimeProgressPercentage reminder proportionally between start and due', async () => {
    const now = new Date('2030-01-01T00:00:00.000Z').getTime();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const startDate = new Date('2030-01-10T00:00:00.000Z').getTime();
    const dueDate = new Date('2030-01-20T00:00:00.000Z').getTime();
    const goalDto = buildGoalDto({
      reminderConfig: {
        enabled: true,
        triggers: [{ enabled: true, type: ReminderTriggerType.TimeProgressPercentage, value: 50 }],
      },
    });
    const findByIdForIdentity = vi.fn().mockResolvedValue({
      toServerDTO: vi.fn().mockReturnValue(goalDto),
    });
    const source = createSource({ findByIdForIdentity });

    const plan = await source.buildGoalPlan('GoalId_goal-1', 'IdentityId_goal-owner');

    expect(plan.desired).toHaveLength(1);
    expect(plan.desired[0]?.runAt).toBe(startDate + (dueDate - startDate) * 0.5);
    expect(plan.desired[0]?.schedulingKey).toBe(
      buildSchedulingKey('goal.reminder', 'GoalId_goal-1', 'progress:50'),
    );
    expect(plan.desired[0]?.observability?.name).toBe('Launch 1.0 · 进度 50% 提醒');

    vi.useRealTimers();
  });

  it('skips reminders whose computed time is at or before now', async () => {
    const now = new Date('2030-01-15T00:00:00.000Z').getTime();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const goalDto = buildGoalDto({
      reminderConfig: {
        enabled: true,
        triggers: [{ enabled: true, type: ReminderTriggerType.RemainingDays, value: 7 }],
      },
    });
    const findByIdForIdentity = vi.fn().mockResolvedValue({
      toServerDTO: vi.fn().mockReturnValue(goalDto),
    });
    const source = createSource({ findByIdForIdentity });

    const plan = await source.buildGoalPlan('GoalId_goal-1', 'IdentityId_goal-owner');

    expect(plan.desired).toEqual([]);

    vi.useRealTimers();
  });

  it('emits no desired intents for completed/abandoned/archived goals before due (fixture E)', async () => {
    const findByIdForIdentity = vi.fn();
    const source = createSource({ findByIdForIdentity });

    for (const status of [GoalStatus.Completed, GoalStatus.Abandoned]) {
      const goal = buildGoalDto({ status });
      findByIdForIdentity.mockResolvedValue({ toServerDTO: vi.fn().mockReturnValue(goal) });
      const plan = await source.buildGoalPlan('GoalId_goal-1', 'IdentityId_goal-owner');
      expect(plan.desired).toEqual([]);
      expect(plan.owner.identityId).toBe('IdentityId_goal-owner');
    }

    const archived = buildGoalDto({ archivedAt: Date.now() });
    findByIdForIdentity.mockResolvedValue({ toServerDTO: vi.fn().mockReturnValue(archived) });
    const archivedPlan = await source.buildGoalPlan('GoalId_goal-1', 'IdentityId_goal-owner');
    expect(archivedPlan.desired).toEqual([]);
  });

  it('returns an empty desired set for a missing goal', async () => {
    const findByIdForIdentity = vi.fn().mockResolvedValue(null);
    const source = createSource({ findByIdForIdentity });

    const plan = await source.buildGoalPlan('GoalId_missing', 'IdentityId_goal-owner');

    expect(findByIdForIdentity).toHaveBeenCalledWith('IdentityId_goal-owner', 'GoalId_missing', {
      includeChildren: true,
    });
    expect(plan.desired).toEqual([]);
    expect(plan.owner).toEqual({
      identityId: 'IdentityId_goal-owner',
      type: 'goal.goal',
      id: 'GoalId_missing',
    });
  });

  it('buildGoalOwner and listGoalRefs support identity-scoped ownership enumeration', async () => {
    const findAllGoalRefs = vi.fn().mockResolvedValue([
      { id: 'goal-1', identityId: 'identity-1' },
      { id: 'goal-2', identityId: 'identity-2' },
    ]);
    const source = createSource({ findAllGoalRefs });

    expect(source.buildGoalOwner('goal-1', 'identity-1')).toEqual({
      identityId: 'identity-1',
      type: 'goal.goal',
      id: 'goal-1',
    });
    expect(await source.listGoalRefs?.()).toEqual([
      { goalId: 'goal-1', identityId: 'identity-1' },
      { goalId: 'goal-2', identityId: 'identity-2' },
    ]);
  });

  it('event name list covers every projection handler key', () => {
    expect(goalScheduleProjectionEventNames).toContain('goal:created');
    expect(goalScheduleProjectionEventNames).toContain('goal:updated');
    expect(goalScheduleProjectionEventNames).toContain('goal:schedule-time-changed');
    expect(goalScheduleProjectionEventNames).toContain('goal:reminder-config-changed');
    expect(goalScheduleProjectionEventNames).toContain('goal:completed');
    expect(goalScheduleProjectionEventNames).toContain('goal:archived');
    expect(goalScheduleProjectionEventNames).toContain('goal:deleted');
  });
});
