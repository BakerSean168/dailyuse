/**
 * Dashboard read-model projection logic.
 *
 * Pure function that aggregates data from multiple bounded contexts
 * into a single dashboard view. No side effects, no transport awareness.
 */

import type {
  ActivityItem,
  DashboardData,
  GoalProgressItem,
  ScheduleItem,
  TaskBoardSummary,
  TrendDay,
} from '@memoflow/contracts/dashboard';
import { GoalStatus } from '@memoflow/contracts/goal';
import type { GoalId, ScheduleTaskId } from '@memoflow/contracts/primitives';
import { ReminderStatus } from '@memoflow/contracts/reminder';
import { TaskInstanceStatus, TaskTemplateStatus } from '@memoflow/contracts/task';
import type {
  DashboardReadSource,
  DashboardTaskInstanceRecord,
  DashboardTaskTemplateRecord,
} from './types';

const DAY_MS = 24 * 60 * 60 * 1000;
const TREND_DAY_COUNT = 7;
const ACTIVITY_LIMIT = 10;
const GOAL_PROGRESS_LIMIT = 5;
const UPCOMING_SCHEDULE_LIMIT = 5;
const UPCOMING_REMINDER_WINDOW_MS = DAY_MS;
const ACTIVITY_WINDOW_MS = 14 * DAY_MS;

/**
 * Compute the full dashboard read-model for a given identity.
 */
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
      id: String(schedule.id) as ScheduleTaskId,
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

      return right.updatedAt - left.updatedAt;
    })
    .slice(0, GOAL_PROGRESS_LIMIT)
    .map((goal) => ({
      id: goal.id as GoalId,
      name: goal.name,
      progress: normalizePercentage(goal.overallProgress),
      status: goal.status as GoalStatus,
      dueDate: goal.targetDate ?? 0,
      keyResultCount: goal.totalKeyResults,
    }));

  const taskBoard: TaskBoardSummary = {
    todo: todayTaskInstances.filter((instance) => instance.status === TaskInstanceStatus.Pending)
      .length,
    inProgress: todayTaskInstances.filter(
      (instance) => instance.status === TaskInstanceStatus.InProgress,
    ).length,
    done: todayTaskInstances.filter((instance) => instance.status === TaskInstanceStatus.Completed)
      .length,
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
    const day = dayMap.get(toDateKey(template.createdAt));
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
  goals: Array<{ id: string; name: string; updatedAt: number }>;
  taskTemplates: DashboardTaskTemplateRecord[];
  taskInstances: DashboardTaskInstanceRecord[];
  schedules: Array<{ id: string; title: string; createdAt: number }>;
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
    const timestamp = template.createdAt;
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
    const timestamp = goal.updatedAt;
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
    const timestamp = schedule.createdAt;
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

  return items.sort((left, right) => right.timestamp - left.timestamp).slice(0, ACTIVITY_LIMIT);
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

// Residual 1165 keep-boundary: dashboard projection startOfDay — timestamp ms → timestamp ms.
// Soft residual 1165: app-react agenda startOfDay takes/returns Date (no force-merge).
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
