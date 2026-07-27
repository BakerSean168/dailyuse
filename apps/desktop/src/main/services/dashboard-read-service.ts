import {
  getDashboardData,
  toDashboardTaskInstanceRecord,
  type DashboardGoalRecord,
  type DashboardTaskTemplateRecord,
  type DashboardScheduleRecord,
  type DashboardReminderRecord,
} from '@dailyuse/dashboard';
import type { DashboardData } from '@dailyuse/contracts/dashboard';
import { createLogger } from '@dailyuse/utils/logger';
import { getGoalRepository } from '@dailyuse/goal/electron';
import {
  getTaskInstanceRepository,
  getTaskTemplateRepository,
} from '@dailyuse/task/electron';
import { getScheduleRepository } from '@dailyuse/schedule/electron';
import { getReminderTemplateRepository } from '@dailyuse/reminder/electron';
import { getNotificationRepository } from '@dailyuse/notification/electron';

const logger = createLogger('DashboardReadService');

/** Soft residual 1156: dual toDashboardTaskInstanceRecord retired onto @dailyuse/dashboard sole. */

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

export async function getDesktopDashboardData(identityId: string): Promise<DashboardData> {
  const goalRepository = getGoalRepository();
  const taskTemplateRepository = getTaskTemplateRepository();
  const taskInstanceRepository = getTaskInstanceRepository();
  const scheduleRepository = getScheduleRepository();
  const reminderTemplateRepository = getReminderTemplateRepository();
  const notificationRepository = getNotificationRepository();

  const data = await getDashboardData(identityId, {
    listGoals: async (id) =>
      (await goalRepository.findByIdentityId(id, {
        includeChildren: true,
        systemView: 'active',
      })).map(toGoalRecord),
    listTaskTemplates: async (id) =>
      (await taskTemplateRepository.findByIdentityId(id)).map(toTaskTemplateRecord),
    listTaskInstances: async (id) =>
      (await taskInstanceRepository.findByIdentityId(id)).map(toDashboardTaskInstanceRecord),
    listSchedules: async (id) =>
      (await scheduleRepository.findByIdentityId(id)).map(toScheduleRecord),
    listUpcomingReminders: async (id, beforeTime) =>
      (await reminderTemplateRepository.findByNextTriggerBefore(beforeTime, id)).map(toReminderRecord),
    countUnreadNotifications: (id) => notificationRepository.countUnread(id),
  });

  logger.debug('Dashboard data aggregated', {
    identityId,
    activeGoals: data.stats.activeGoals,
    activeTasks: data.stats.activeTasks,
    completedToday: data.stats.completedToday,
    upcomingReminders: data.stats.upcomingReminders,
    unreadNotifications: data.stats.unreadNotifications,
    scheduleConflicts: data.stats.scheduleConflicts,
  });

  return data;
}
