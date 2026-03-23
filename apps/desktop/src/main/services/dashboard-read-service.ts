import { getDashboardData, type DashboardData } from '@dailyuse/dashboard';
import { createLogger } from '@dailyuse/utils';
import { getGoalRepository } from '@dailyuse/goal/electron-entry';
import {
  getTaskInstanceRepository,
  getTaskTemplateRepository,
} from '@dailyuse/task/electron-entry';
import { getScheduleRepository } from '@dailyuse/schedule/electron-entry';
import { getReminderTemplateRepository } from '@dailyuse/reminder/electron-entry';
import { getNotificationRepository } from '@dailyuse/notification/electron-entry';

const logger = createLogger('DashboardReadService');

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
    listTaskInstances: (id) => taskInstanceRepository.findByIdentityId(id),
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
