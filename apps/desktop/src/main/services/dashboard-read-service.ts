import {
  getDashboardData,
  type DashboardData,
  type DashboardTaskInstanceRecord,
} from '@dailyuse/dashboard';
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

function toDashboardTaskInstanceRecord(
  instance: Awaited<ReturnType<ReturnType<typeof getTaskInstanceRepository>['findByIdentityId']>>[number],
): DashboardTaskInstanceRecord {
  return {
    id: String(instance.id),
    templateId: String(instance.templateId),
    status: instance.status,
    instanceDate: instance.instanceDate,
    actualEndTime: instance.actualEndTime,
    updatedAt: instance.updatedAt.getTime(),
    deletedAt: instance.deletedAt,
    isOverdue: () => instance.isOverdue(),
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
    listGoals: (id) =>
      goalRepository.findByIdentityId(id, {
        includeChildren: true,
        systemView: 'active',
      }),
    listTaskTemplates: (id) => taskTemplateRepository.findByIdentityId(id),
    listTaskInstances: async (id) =>
      (await taskInstanceRepository.findByIdentityId(id)).map(toDashboardTaskInstanceRecord),
    listSchedules: (id) => scheduleRepository.findByIdentityId(id),
    listUpcomingReminders: (id, beforeTime) =>
      reminderTemplateRepository.findByNextTriggerBefore(beforeTime, id),
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
