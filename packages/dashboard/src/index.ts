import type {
  ActivityItem,
  DashboardData,
  GoalProgressItem,
  ScheduleItem,
  TaskBoardSummary,
  TrendDay,
} from '@dailyuse/contracts/dashboard';
import { GoalStatus } from '@dailyuse/contracts/goal';
import { ReminderStatus } from '@dailyuse/contracts/reminder';
import { TaskInstanceStatus, TaskTemplateStatus } from '@dailyuse/contracts/task';

const DAY_MS = 24 * 60 * 60 * 1000;
const TREND_DAY_COUNT = 7;
const ACTIVITY_LIMIT = 10;
const GOAL_PROGRESS_LIMIT = 5;
const UPCOMING_SCHEDULE_LIMIT = 5;
const UPCOMING_REMINDER_WINDOW_MS = DAY_MS;
const ACTIVITY_WINDOW_MS = 14 * DAY_MS;

export type { DashboardData } from '@dailyuse/contracts/dashboard';
export type {
  DashboardStats,
  ActivityItem,
  TrendDay,
  GoalProgressItem,
  TaskBoardSummary,
  ScheduleItem,
} from '@dailyuse/contracts/dashboard';

export interface DashboardGoalRecord {
  id: string;
  name: string;
  status: string;
  deletedAt: Date | null;
  priority: number;
  updatedAt: Date;
  progress: number;
  targetDate: Date | null;
  keyResults: readonly unknown[];
}

export interface DashboardTaskTemplateRecord {
  id: string;
  title: string;
  status: string;
  deletedAt: Date | null;
  createdAt: Date;
}

export interface DashboardTaskInstanceRecord {
  id: string;
  templateId: string;
  status: string;
  instanceDate: number;
  actualEndTime: number | null;
  updatedAt: number;
  deletedAt: Date | null;
  isOverdue(): boolean;
}

export interface DashboardScheduleRecord {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  priority?: number | null;
  hasConflict: boolean;
  createdAt: Date;
}

export interface DashboardReminderRecord {
  deletedAt: Date | null;
  status: string;
  effectiveEnabled: boolean;
  nextTriggerAt: number | null;
}

export interface DashboardReadSource {
  listGoals(identityId: string): Promise<DashboardGoalRecord[]>;
  listTaskTemplates(identityId: string): Promise<DashboardTaskTemplateRecord[]>;
  listTaskInstances(identityId: string): Promise<DashboardTaskInstanceRecord[]>;
  listSchedules(identityId: string): Promise<DashboardScheduleRecord[]>;
  listUpcomingReminders(identityId: string, beforeTime: number): Promise<DashboardReminderRecord[]>;
  countUnreadNotifications(identityId: string): Promise<number>;
}

export async function getDashboardData(
  identityId: string,
  source: DashboardReadSource,
): Promise<DashboardData> {
  const now = Date.now();
  const todayStart = startOfDay(now);
  const todayEnd = todayStart + DAY_MS - 1;

  const [goals, taskTemplates, taskInstances, schedules, reminders, unreadNotifications] =
    await Promise.all([
      source.listGoals(identityId),
      source.listTaskTemplates(identityId),
      source.listTaskInstances(identityId),
      source.listSchedules(identityId),
      source.listUpcomingReminders(identityId, now + UPCOMING_REMINDER_WINDOW_MS),
      source.countUnreadNotifications(identityId),
    ]);

  const activeGoals = goals.filter(
    (goal) => goal.status === GoalStatus.Active && goal.deletedAt === null,
  );
  const activeTemplates = taskTemplates.filter(
    (template) =>
      template.deletedAt === null &&
      template.status !== TaskTemplateStatus.Deleted &&
      template.status !== TaskTemplateStatus.Archived,
  );
  const liveTaskInstances = taskInstances.filter((instance) => instance.deletedAt === null);
  const todayTaskInstances = liveTaskInstances.filter((instance) =>
    isWithinRange(instance.instanceDate, todayStart, todayEnd),
  );
  const completedToday = liveTaskInstances.filter((instance) => {
    if (instance.status !== TaskInstanceStatus.Completed) {
      return false;
    }

    const completedAt = getTaskCompletionTimestamp(instance);
    return completedAt !== null && isWithinRange(completedAt, todayStart, todayEnd);
  }).length;
  const overdueTaskCount = liveTaskInstances.filter(
    (instance) => instance.status === TaskInstanceStatus.Expired || instance.isOverdue(),
  ).length;

  const upcomingReminders = reminders.filter(
    (reminder) =>
      reminder.deletedAt === null &&
      reminder.status === ReminderStatus.Active &&
      reminder.effectiveEnabled &&
      reminder.nextTriggerAt !== null &&
      reminder.nextTriggerAt >= now,
  );

  const activeSchedules = schedules.filter((schedule) => schedule.endTime >= now);
  const upcomingSchedule: ScheduleItem[] = activeSchedules
    .filter((schedule) => schedule.startTime >= now)
    .sort((left, right) => left.startTime - right.startTime)
    .slice(0, UPCOMING_SCHEDULE_LIMIT)
    .map((schedule) => ({
      id: String(schedule.id),
      title: schedule.title,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      priority: schedule.priority ?? 0,
    }));

  const goalProgress: GoalProgressItem[] = activeGoals
    .slice()
    .sort((left, right) => {
      if (right.priority !== left.priority) {
        return right.priority - left.priority;
      }

      return right.updatedAt.getTime() - left.updatedAt.getTime();
    })
    .slice(0, GOAL_PROGRESS_LIMIT)
    .map((goal) => ({
      id: String(goal.id),
      name: goal.name,
      progress: normalizePercentage(goal.progress),
      status: goal.status,
      dueDate: goal.targetDate?.getTime() ?? 0,
      keyResultCount: goal.keyResults.length,
    }));

  const taskBoard: TaskBoardSummary = {
    todo: todayTaskInstances.filter((instance) => instance.status === TaskInstanceStatus.Pending).length,
    inProgress: todayTaskInstances.filter(
      (instance) => instance.status === TaskInstanceStatus.InProgress,
    ).length,
    done: todayTaskInstances.filter((instance) => instance.status === TaskInstanceStatus.Completed).length,
    overdue: overdueTaskCount,
  };

  return {
    stats: {
      activeTasks: taskBoard.todo + taskBoard.inProgress,
      completedToday,
      activeGoals: activeGoals.length,
      upcomingReminders: upcomingReminders.length,
      unreadNotifications,
      scheduleConflicts: activeSchedules.filter((schedule) => schedule.hasConflict).length,
    },
    activityTimeline: buildActivityTimeline({
      goals: activeGoals,
      taskTemplates: activeTemplates,
      taskInstances: liveTaskInstances,
      schedules,
      now,
    }),
    trendDays: buildTrendDays(now, activeTemplates, liveTaskInstances),
    goalProgress,
    taskBoard,
    upcomingSchedule,
  };
}

function buildTrendDays(
  now: number,
  taskTemplates: DashboardTaskTemplateRecord[],
  taskInstances: DashboardTaskInstanceRecord[],
): TrendDay[] {
  const days = Array.from({ length: TREND_DAY_COUNT }, (_, index) => {
    const dayStart = startOfDay(now - (TREND_DAY_COUNT - 1 - index) * DAY_MS);
    const date = new Date(dayStart).toISOString().slice(0, 10);

    return {
      date,
      tasksCompleted: 0,
      tasksCreated: 0,
      focusMinutes: 0,
    };
  });

  const dayMap = new Map(days.map((day) => [day.date, day]));

  for (const template of taskTemplates) {
    const day = dayMap.get(toDateKey(template.createdAt.getTime()));
    if (day) {
      day.tasksCreated += 1;
    }
  }

  for (const instance of taskInstances) {
    if (instance.status !== TaskInstanceStatus.Completed) {
      continue;
    }

    const completedAt = instance.actualEndTime ?? instance.updatedAt;
    const day = dayMap.get(toDateKey(completedAt));
    if (day) {
      day.tasksCompleted += 1;
    }
  }

  return days;
}

function buildActivityTimeline(input: {
  goals: DashboardGoalRecord[];
  taskTemplates: DashboardTaskTemplateRecord[];
  taskInstances: DashboardTaskInstanceRecord[];
  schedules: DashboardScheduleRecord[];
  now: number;
}): ActivityItem[] {
  const recentCutoff = input.now - ACTIVITY_WINDOW_MS;
  const templateMap = new Map(
    input.taskTemplates.map((template) => [String(template.id), template.title]),
  );

  const items: ActivityItem[] = [];

  for (const instance of input.taskInstances) {
    if (instance.status !== TaskInstanceStatus.Completed) {
      continue;
    }

    const timestamp = instance.actualEndTime ?? instance.updatedAt;
    if (timestamp < recentCutoff) {
      continue;
    }

    items.push({
      id: `task-completed-${String(instance.id)}`,
      type: 'task_completed',
      description: `完成了任务「${templateMap.get(String(instance.templateId)) ?? '未命名任务'}」`,
      timestamp,
    });
  }

  for (const template of input.taskTemplates) {
    const timestamp = template.createdAt.getTime();
    if (timestamp < recentCutoff) {
      continue;
    }

    items.push({
      id: `task-created-${String(template.id)}`,
      type: 'task_created',
      description: `创建了新任务「${template.title}」`,
      timestamp,
    });
  }

  for (const goal of input.goals) {
    const timestamp = goal.updatedAt.getTime();
    if (timestamp < recentCutoff) {
      continue;
    }

    items.push({
      id: `goal-updated-${String(goal.id)}`,
      type: 'goal_updated',
      description: `更新了目标「${goal.name}」的进度`,
      timestamp,
    });
  }

  for (const schedule of input.schedules) {
    const timestamp = schedule.createdAt.getTime();
    if (timestamp < recentCutoff) {
      continue;
    }

    items.push({
      id: `schedule-created-${String(schedule.id)}`,
      type: 'schedule_created',
      description: `创建了日程「${schedule.title}」`,
      timestamp,
    });
  }

  return items
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, ACTIVITY_LIMIT);
}

function getTaskCompletionTimestamp(instance: DashboardTaskInstanceRecord): number | null {
  return instance.actualEndTime ?? instance.updatedAt ?? null;
}

function normalizePercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function toDateKey(timestamp: number): string {
  return new Date(startOfDay(timestamp)).toISOString().slice(0, 10);
}

function isWithinRange(value: number, start: number, end: number): boolean {
  return value >= start && value <= end;
}
