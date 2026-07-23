import type { PrismaClient } from '@dailyuse/database';
import {
  getDashboardData,
  toDashboardTaskInstanceRecord,
} from '@dailyuse/dashboard';
import type { DashboardData } from '@dailyuse/contracts/dashboard';
import { createGoalPrismaRepositories } from '@dailyuse/goal';
import { createTaskPrismaRepositories } from '@dailyuse/task';
import { createSchedulePrismaModule } from '@dailyuse/schedule';
import { createReminderPrismaRepositories } from '@dailyuse/reminder';
import { createNotificationPrismaRepositories } from '@dailyuse/notification';

/** Soft residual 1156: dual toDashboardTaskInstanceRecord retired onto @dailyuse/dashboard sole. */

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
    listGoals: (id) =>
      goalRepos.goalRepository.findByIdentityId(id, {
        includeChildren: true,
        systemView: 'active',
      }),
    listTaskTemplates: (id) => taskRepos.taskTemplateRepository.findByIdentityId(id),
    listTaskInstances: async (id) =>
      (await taskRepos.taskInstanceRepository.findByIdentityId(id)).map(
        toDashboardTaskInstanceRecord,
      ),
    listSchedules: (id) => scheduleModule.scheduleRepository.findByIdentityId(id),
    listUpcomingReminders: (id, beforeTime) =>
      reminderRepos.reminderTemplateRepository.findByNextTriggerBefore(beforeTime, id),
    countUnreadNotifications: (id) =>
      notificationRepos.notificationRepository.countUnread(id),
  });
}
