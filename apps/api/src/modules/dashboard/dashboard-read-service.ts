import type { PrismaClient } from '@dailyuse/database';
import {
  getDashboardData,
  type DashboardTaskInstanceRecord,
} from '@dailyuse/dashboard';
import type { DashboardData } from '@dailyuse/contracts/dashboard';
import { createGoalPrismaRepositories } from '@dailyuse/goal';
import { createTaskPrismaRepositories } from '@dailyuse/task';
import { createSchedulePrismaModule } from '@dailyuse/schedule';
import { createReminderPrismaRepositories } from '@dailyuse/reminder';
import { createNotificationPrismaRepositories } from '@dailyuse/notification';

interface TaskInstanceSnapshot {
  id: string | number;
  templateId: string | number;
  status: string;
  instanceDate: number;
  actualEndTime: number | null;
  updatedAt: Date;
  deletedAt: Date | null;
  isOverdue(): boolean;
}

function toDashboardTaskInstanceRecord(instance: TaskInstanceSnapshot): DashboardTaskInstanceRecord {
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
