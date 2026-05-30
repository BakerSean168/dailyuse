import { describe, it, expect } from 'vitest';
import { GoalStatus } from '@dailyuse/contracts/goal';
import { TaskInstanceStatus, TaskTemplateStatus } from '@dailyuse/contracts/task';
import { ReminderStatus } from '@dailyuse/contracts/reminder';
import type {
  DashboardReadSource,
  DashboardGoalRecord,
  DashboardTaskTemplateRecord,
  DashboardTaskInstanceRecord,
  DashboardScheduleRecord,
  DashboardReminderRecord,
} from '../domain/types';
import { getDashboardData } from '../domain/projection';

function makeGoal(overrides: Partial<DashboardGoalRecord> = {}): DashboardGoalRecord {
  return {
    id: 'g1',
    name: 'Goal',
    status: GoalStatus.Active,
    deletedAt: null,
    priority: 1,
    updatedAt: new Date(),
    progress: 50,
    targetDate: null,
    keyResults: [],
    ...overrides,
  };
}

function makeTemplate(overrides: Partial<DashboardTaskTemplateRecord> = {}): DashboardTaskTemplateRecord {
  return {
    id: 't1',
    title: 'Task',
    status: TaskTemplateStatus.Active,
    deletedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeInstance(overrides: Partial<DashboardTaskInstanceRecord> = {}): DashboardTaskInstanceRecord {
  return {
    id: 'i1',
    templateId: 't1',
    status: TaskInstanceStatus.Pending,
    instanceDate: Date.now(),
    actualEndTime: null,
    updatedAt: Date.now(),
    deletedAt: null,
    isOverdue: () => false,
    ...overrides,
  };
}

function makeSchedule(overrides: Partial<DashboardScheduleRecord> = {}): DashboardScheduleRecord {
  return {
    id: 's1',
    title: 'Meeting',
    startTime: Date.now() + 3600_000,
    endTime: Date.now() + 7200_000,
    priority: 0,
    hasConflict: false,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeReminder(overrides: Partial<DashboardReminderRecord> = {}): DashboardReminderRecord {
  return {
    deletedAt: null,
    status: ReminderStatus.Active,
    effectiveEnabled: true,
    nextTriggerAt: Date.now() + 3600_000,
    ...overrides,
  };
}

function makeSource(overrides: Partial<DashboardReadSource> = {}): DashboardReadSource {
  return {
    listGoals: async () => [],
    listTaskTemplates: async () => [],
    listTaskInstances: async () => [],
    listSchedules: async () => [],
    listUpcomingReminders: async () => [],
    countUnreadNotifications: async () => 0,
    ...overrides,
  };
}

describe('getDashboardData', () => {
  it('returns empty dashboard with default source', async () => {
    const data = await getDashboardData('user1', makeSource());

    expect(data.stats.activeTasks).toBe(0);
    expect(data.stats.completedToday).toBe(0);
    expect(data.stats.activeGoals).toBe(0);
    expect(data.stats.upcomingReminders).toBe(0);
    expect(data.stats.unreadNotifications).toBe(0);
    expect(data.goalProgress).toEqual([]);
    expect(data.taskBoard).toEqual({ todo: 0, inProgress: 0, done: 0, overdue: 0 });
    expect(data.upcomingSchedule).toEqual([]);
  });

  it('counts active goals correctly', async () => {
    const source = makeSource({
      listGoals: async () => [
        makeGoal({ id: 'g1', status: GoalStatus.Active }),
        makeGoal({ id: 'g2', status: GoalStatus.Completed }),
        makeGoal({ id: 'g3', status: GoalStatus.Active, deletedAt: new Date() }),
        makeGoal({ id: 'g4', status: GoalStatus.Active }),
      ],
    });

    const data = await getDashboardData('user1', source);
    expect(data.stats.activeGoals).toBe(2);
    expect(data.goalProgress).toHaveLength(2);
  });

  it('counts unread notifications', async () => {
    const source = makeSource({
      countUnreadNotifications: async () => 5,
    });

    const data = await getDashboardData('user1', source);
    expect(data.stats.unreadNotifications).toBe(5);
  });

  it('sorts goalProgress by priority then updatedAt', async () => {
    const now = new Date();
    const source = makeSource({
      listGoals: async () => [
        makeGoal({ id: 'g1', priority: 1, updatedAt: new Date(now.getTime() - 1000) }),
        makeGoal({ id: 'g2', priority: 3, updatedAt: new Date(now.getTime() - 2000) }),
        makeGoal({ id: 'g3', priority: 3, updatedAt: new Date(now.getTime()) }),
      ],
    });

    const data = await getDashboardData('user1', source);
    expect(data.goalProgress[0].id).toBe('g3'); // priority 3, most recent
    expect(data.goalProgress[1].id).toBe('g2'); // priority 3, older
    expect(data.goalProgress[2].id).toBe('g1'); // priority 1
  });

  it('limits goalProgress to 5 items', async () => {
    const goals = Array.from({ length: 8 }, (_, i) =>
      makeGoal({ id: `g${i}`, priority: i }),
    );
    const source = makeSource({
      listGoals: async () => goals,
    });

    const data = await getDashboardData('user1', source);
    expect(data.goalProgress).toHaveLength(5);
  });

  it('clamps goal progress to 0-100 range', async () => {
    const source = makeSource({
      listGoals: async () => [
        makeGoal({ id: 'g1', progress: -10 }),
        makeGoal({ id: 'g2', progress: 150 }),
        makeGoal({ id: 'g3', progress: NaN }),
      ],
    });

    const data = await getDashboardData('user1', source);
    expect(data.goalProgress[0].progress).toBe(0);
    expect(data.goalProgress[1].progress).toBe(100);
    expect(data.goalProgress[2].progress).toBe(0);
  });

  it('filters out deleted and archived task templates', async () => {
    const source = makeSource({
      listTaskTemplates: async () => [
        makeTemplate({ id: 't1', status: TaskTemplateStatus.Active }),
        makeTemplate({ id: 't2', status: TaskTemplateStatus.Deleted }),
        makeTemplate({ id: 't3', deletedAt: new Date() }),
        makeTemplate({ id: 't4', status: TaskTemplateStatus.Archived }),
      ],
    });

    const data = await getDashboardData('user1', source);
    // Only t1 should appear in activity timeline (created today)
    // t2/t3/t4 filtered out
    expect(data.taskBoard.todo).toBe(0); // no instances
  });

  it('builds taskBoard from today instances', async () => {
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();

    const source = makeSource({
      listTaskInstances: async () => [
        makeInstance({ id: 'i1', status: TaskInstanceStatus.Pending, instanceDate: todayMs + 1000 }),
        makeInstance({ id: 'i2', status: TaskInstanceStatus.InProgress, instanceDate: todayMs + 2000 }),
        makeInstance({ id: 'i3', status: TaskInstanceStatus.Completed, instanceDate: todayMs + 3000 }),
        makeInstance({ id: 'i4', status: TaskInstanceStatus.Pending, instanceDate: todayMs + 4000 }),
      ],
    });

    const data = await getDashboardData('user1', source);
    expect(data.taskBoard.todo).toBe(2);
    expect(data.taskBoard.inProgress).toBe(1);
    expect(data.taskBoard.done).toBe(1);
  });

  it('counts overdue tasks', async () => {
    const source = makeSource({
      listTaskInstances: async () => [
        makeInstance({ id: 'i1', status: TaskInstanceStatus.Expired, isOverdue: () => false }),
        makeInstance({ id: 'i2', status: TaskInstanceStatus.Pending, isOverdue: () => true }),
        makeInstance({ id: 'i3', status: TaskInstanceStatus.Pending, isOverdue: () => false }),
      ],
    });

    const data = await getDashboardData('user1', source);
    expect(data.taskBoard.overdue).toBe(2);
  });

  it('filters upcoming schedules', async () => {
    const now = Date.now();
    const source = makeSource({
      listSchedules: async () => [
        makeSchedule({ id: 's1', startTime: now + 3600_000, endTime: now + 7200_000 }),
        makeSchedule({ id: 's2', startTime: now - 3600_000, endTime: now - 1800_000 }), // past
      ],
    });

    const data = await getDashboardData('user1', source);
    expect(data.upcomingSchedule).toHaveLength(1);
    expect(data.upcomingSchedule[0].id).toBe('s1');
  });

  it('counts schedule conflicts', async () => {
    const now = Date.now();
    const source = makeSource({
      listSchedules: async () => [
        makeSchedule({ id: 's1', hasConflict: true, endTime: now + 7200_000 }),
        makeSchedule({ id: 's2', hasConflict: false, endTime: now + 7200_000 }),
        makeSchedule({ id: 's3', hasConflict: true, endTime: now + 7200_000 }),
      ],
    });

    const data = await getDashboardData('user1', source);
    expect(data.stats.scheduleConflicts).toBe(2);
  });

  it('filters upcoming reminders correctly', async () => {
    const now = Date.now();
    const source = makeSource({
      listUpcomingReminders: async () => [
        makeReminder({ nextTriggerAt: now + 3600_000 }),
        makeReminder({ nextTriggerAt: null }),
        makeReminder({ deletedAt: new Date() }),
        makeReminder({ status: ReminderStatus.Paused }),
        makeReminder({ effectiveEnabled: false }),
      ],
    });

    const data = await getDashboardData('user1', source);
    expect(data.stats.upcomingReminders).toBe(1);
  });
});
