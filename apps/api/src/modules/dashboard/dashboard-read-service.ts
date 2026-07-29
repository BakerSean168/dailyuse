import type { PrismaClient } from '@memoflow/database';
import {
  getDashboardData,
  toDashboardTaskInstanceRecord,
  type DashboardGoalRecord,
  type DashboardTaskTemplateRecord,
  type DashboardScheduleRecord,
  type DashboardReminderRecord,
} from '@memoflow/dashboard';
import type { DashboardData } from '@memoflow/contracts/dashboard';
import { createGoalPrismaRepositories } from '@memoflow/goal';
import { createTaskPrismaRepositories } from '@memoflow/task';
import { createSchedulePrismaModule } from '@memoflow/schedule';
import { createReminderPrismaRepositories } from '@memoflow/reminder';
import { createNotificationPrismaRepositories } from '@memoflow/notification';

/** Soft residual 1156: dual toDashboardTaskInstanceRecord retired onto @memoflow/dashboard sole. */

function toGoalRecord(goal: {
  id: { toString(): string } | string;
  name: string;
  status: string;
  deletedAt: number | null;
  priority: number;
  updatedAt: number;
  progress: number;
  targetDate: number | null;
  keyResults: readonly unknown[];
}): DashboardGoalRecord {
  return {
    id: String(goal.id),
    name: goal.name,
    status: goal.status,
    deletedAt: goal.deletedAt,
    priority: goal.priority,
    updatedAt: goal.updatedAt,
    progress: goal.progress,
    targetDate: goal.targetDate,
    keyResults: goal.keyResults,
  };
}

function toTaskTemplateRecord(template: {
  id: { toString(): string } | string;
  title: string;
  status: string;
  deletedAt: number | null;
  createdAt: number;
}): DashboardTaskTemplateRecord {
  return {
    id: String(template.id),
    title: template.title,
    status: template.status,
    deletedAt: template.deletedAt,
    createdAt: template.createdAt,
  };
}

function toMs(value: Date | number | string | null | undefined): number {
  if (value == null) return Date.now();
  if (typeof value === 'number') return Number.isFinite(value) ? value : Date.now();
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isFinite(t) ? t : Date.now();
  }
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function toScheduleRecord(schedule: {
  id: { toString(): string } | string;
  title?: string | null;
  name?: string | null;
  startTime?: number | Date | null;
  endTime?: number | Date | null;
  schedule?: { startDate?: string | null; endDate?: string | null } | null;
  priority?: number | null;
  hasConflict?: boolean;
  createdAt: number | Date;
}): DashboardScheduleRecord {
  const startTime =
    schedule.startTime != null
      ? toMs(schedule.startTime)
      : schedule.schedule?.startDate
        ? toMs(schedule.schedule.startDate)
        : Date.now();
  const endTime =
    schedule.endTime != null
      ? toMs(schedule.endTime)
      : schedule.schedule?.endDate
        ? toMs(schedule.schedule.endDate)
        : startTime;
  return {
    id: String(schedule.id),
    title: schedule.title ?? schedule.name ?? '',
    startTime,
    endTime,
    priority: schedule.priority ?? null,
    hasConflict: schedule.hasConflict ?? false,
    createdAt: toMs(schedule.createdAt),
  };
}

function toReminderRecord(reminder: {
  deletedAt: number | null;
  status: string;
  effectiveEnabled: boolean;
  nextTriggerAt: number | null;
}): DashboardReminderRecord {
  return {
    deletedAt: reminder.deletedAt,
    status: reminder.status,
    effectiveEnabled: reminder.effectiveEnabled,
    nextTriggerAt: reminder.nextTriggerAt,
  };
}

export async function getApiDashboardData(
  db: PrismaClient,
  identityId: string,
): Promise<DashboardData> {
  const goalRepos = createGoalPrismaRepositories(db);
  const taskRepos = createTaskPrismaRepositories(db);
  const scheduleModule = createSchedulePrismaModule(db);
  const reminderRepos = createReminderPrismaRepositories(db);
  const notificationRepos = createNotificationPrismaRepositories(db);

  return getDashboardData(identityId, {
    listGoals: async (id) =>
      (await goalRepos.goalRepository.findByIdentityId(id, {
        includeChildren: true,
        systemView: 'active',
      })).map(toGoalRecord),
    listTaskTemplates: async (id) =>
      (await taskRepos.taskTemplateRepository.findByIdentityId(id)).map(toTaskTemplateRecord),
    listTaskInstances: async (id) =>
      (await taskRepos.taskInstanceRepository.findByIdentityId(id)).map(
        toDashboardTaskInstanceRecord,
      ),
    listSchedules: async (id) =>
      (await scheduleModule.scheduleRepository.findByIdentityId(id)).map(toScheduleRecord),
    listUpcomingReminders: async (id, beforeTime) =>
      (await reminderRepos.reminderTemplateRepository.findByNextTriggerBefore(beforeTime, id)).map(
        toReminderRecord,
      ),
    countUnreadNotifications: (id) =>
      notificationRepos.notificationRepository.countUnread(id),
  });
}
