import type { PrismaClient } from '@memoflow/database';
import type { ScheduleNotificationPort } from '../../schedule-execution';
import { CreateNotificationUseCase } from '../application/use-cases/commands/create-notification.use-case';
import {
  NotificationPreferencePrismaRepository,
  NotificationPrismaRepository,
  NotificationTemplatePrismaRepository,
} from './adapters/prisma';
import {
  createNotificationModule,
  type NotificationModuleInstance,
  type NotificationRuntimeContributionsInput,
} from './notification.module';

export interface CreateNotificationPrismaModuleOptions {
  readonly runtimeContributions?: NotificationRuntimeContributionsInput;
}

export function createNotificationPrismaModule(
  db: PrismaClient,
  options: CreateNotificationPrismaModuleOptions = {},
): NotificationModuleInstance {
  return createNotificationModule({
    notificationRepository: new NotificationPrismaRepository(db),
    preferenceRepository: new NotificationPreferencePrismaRepository(db),
    templateRepository: new NotificationTemplatePrismaRepository(db),
    runtimeContributions: options.runtimeContributions,
  });
}

export function createNotificationPrismaRepositories(db: PrismaClient) {
  return {
    notificationRepository: new NotificationPrismaRepository(db),
    notificationPreferenceRepository: new NotificationPreferencePrismaRepository(db),
    notificationTemplateRepository: new NotificationTemplatePrismaRepository(db),
  };
}

export function createNotificationPrismaScheduleNotificationPort(
  db: PrismaClient,
): ScheduleNotificationPort {
  const repositories = createNotificationPrismaRepositories(db);
  const createNotification = new CreateNotificationUseCase(
    repositories.notificationRepository,
    repositories.notificationTemplateRepository,
    repositories.notificationPreferenceRepository,
  );

  return {
    createNotification(request) {
      return createNotification.execute({
        ...request,
        channels: request.channels ? Array.from(request.channels) : undefined,
      });
    },
  };
}
