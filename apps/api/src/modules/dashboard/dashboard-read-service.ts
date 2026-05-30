import type { PrismaClient } from '@dailyuse/database';
import {
  getDashboardData,
  type DashboardData,
  type DashboardTaskInstanceRecord,
} from '@dailyuse/dashboard';
import { GoalPrismaRepository } from '@dailyuse/goal/infrastructure-server';
import { TaskInstancePrismaRepository, TaskTemplatePrismaRepository } from '@dailyuse/task/infrastructure-server';
import { SchedulePrismaRepository } from '@dailyuse/schedule/infrastructure-server';
import { ReminderTemplatePrismaRepository } from '@dailyuse/reminder/infrastructure-server';
import { NotificationPrismaRepository } from '@dailyuse/notification/infrastructure-server';

function toDashboardTaskInstanceRecord(
  instance: Awaited<ReturnType<TaskInstancePrismaRepository['findByIdentityId']>>[number],
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

export async function getApiDashboardData(
  db: PrismaClient,
  identityId: string,
): Promise<DashboardData> {
  const goalRepository = new GoalPrismaRepository(db);
  const taskTemplateRepository = new TaskTemplatePrismaRepository(db);
  const taskInstanceRepository = new TaskInstancePrismaRepository(db);
  const scheduleRepository = new SchedulePrismaRepository(db);
  const reminderTemplateRepository = new ReminderTemplatePrismaRepository(db);
  const notificationRepository = new NotificationPrismaRepository(db);

  return getDashboardData(identityId, {
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
}
