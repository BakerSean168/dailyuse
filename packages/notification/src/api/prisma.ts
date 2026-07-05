/**
 * Notification Prisma Composition Helpers
 *
 * Public-facing convenience factories for composing the notification module
 * with Prisma-backed repositories.
 */

import type { PrismaClient } from '@dailyuse/database';
import { CreateNotificationUseCase } from '../commands';
import type { ScheduleNotificationPort } from '../schedule-execution';
import {
  createNotificationModule,
  NotificationPrismaRepository,
  NotificationPreferencePrismaRepository,
  NotificationTemplatePrismaRepository,
  type NotificationModuleInstance,
  type NotificationModuleRuntimeContribution,
} from '../infrastructure-server';

export interface CreateNotificationPrismaModuleOptions {
  readonly runtimeContributions?:
    | NotificationModuleRuntimeContribution
    | readonly NotificationModuleRuntimeContribution[];
}

/**
 * Create a fully-wired notification module backed by Prisma repositories.
 */
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

/**
 * Create standalone notification Prisma repositories.
 * Useful for cross-module wiring (e.g., CreateNotificationUseCase).
 */
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
