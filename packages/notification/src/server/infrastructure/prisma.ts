import type { PrismaClient } from '@memoflow/database';
import type { ScheduleNotificationPort } from '../../schedule-execution';
import { CreateNotificationUseCase } from '../application/use-cases/commands/create-notification.use-case';
import {
  NotificationPreferencePrismaRepository,
  NotificationPrismaRepository,
  NotificationTemplatePrismaRepository,
} from './adapters/prisma';
import { createNotificationRuntimeContribution } from './runtime/notification.runtime';
import {
  createNotificationModule,
  type NotificationModuleInstance,
  type NotificationRuntimeContributionsInput,
} from './notification.module';

export interface CreateNotificationPrismaModuleOptions {
  readonly runtimeContributions?: NotificationRuntimeContributionsInput;
  /** R3e：渠道投递适配器（默认 no-op，仅推进渠道状态）。 */
  readonly channelDeliverer?: import('./runtime/notification.runtime').NotificationChannelDeliverer;
}

export function createNotificationPrismaModule(
  db: PrismaClient,
  options: CreateNotificationPrismaModuleOptions = {},
): NotificationModuleInstance {
  const notificationRepository = new NotificationPrismaRepository(db);
  return createNotificationModule({
    notificationRepository,
    preferenceRepository: new NotificationPreferencePrismaRepository(db),
    templateRepository: new NotificationTemplatePrismaRepository(db),
    runtimeContributions: options.runtimeContributions ?? [
      createNotificationRuntimeContribution({
        repository: notificationRepository,
        deliverer: options.channelDeliverer,
      }),
    ],
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
