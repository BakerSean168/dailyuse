import type { PrismaClient } from '@memoflow/database';
import type { ScheduleNotificationPort } from '../../schedule-execution';
import { CreateNotificationUseCase } from '../application/use-cases/commands/create-notification.use-case';
import {
  NotificationPreferencePrismaRepository,
  NotificationPrismaRepository,
  NotificationTemplatePrismaRepository,
  NotificationReliableOperationPrismaAdapter,
} from './adapters/prisma';
import { createNotificationRuntimeContribution } from './runtime/notification.runtime';
import {
  createNotificationModule,
  type NotificationModuleInstance,
  type NotificationRuntimeContributionsInput,
} from './notification.module';

import { NotificationMetricsService, globalNotificationMetrics } from '../domain/services/notification-metrics-service';

import {
  RealInAppChannelDeliverer,
  RealDesktopChannelDeliverer,
} from './adapters/deliverers/real-channel-deliverers';

import { PrismaOperationAuditRepository } from '@memoflow/patterns/operations';

export interface CreateNotificationPrismaModuleOptions {
  readonly closureChecker: (identityId: string) => Promise<boolean>;
  readonly runtimeContributions?: NotificationRuntimeContributionsInput;
  readonly durableRuntime?: import('./runtime/notification.runtime').NotificationDurableRuntimePort;
  readonly channelDeliverer?: import('./runtime/notification.runtime').NotificationChannelDeliverer;
  readonly channelDeliverers?: Record<string, import('./runtime/notification.runtime').NotificationChannelDeliverer>;
  readonly channelCapabilities?: import('./runtime/notification.runtime').ChannelCapabilitySpec[];
  readonly desktopTransport?: unknown;
  readonly pushTransport?: unknown;
  readonly metricsService?: NotificationMetricsService;
}

export function createNotificationPrismaModule(
  db: PrismaClient,
  options: CreateNotificationPrismaModuleOptions,
): NotificationModuleInstance {
  if (!options?.closureChecker) {
    throw new Error('[FAIL-CLOSED] createNotificationPrismaModule requires options.closureChecker');
  }

  const metricsService = options.metricsService ?? globalNotificationMetrics;
  const notificationRepository = new NotificationPrismaRepository(db, metricsService);
  const reliableAdapter = new NotificationReliableOperationPrismaAdapter(db, metricsService);

  const defaultDeliverers: Record<string, import('./runtime/notification.runtime').NotificationChannelDeliverer> = {
    InApp: new RealInAppChannelDeliverer(notificationRepository),
    'in-app': new RealInAppChannelDeliverer(notificationRepository),
    Desktop: new RealDesktopChannelDeliverer(options.desktopTransport),
    desktop: new RealDesktopChannelDeliverer(options.desktopTransport),
    Push: new RealDesktopChannelDeliverer(options.pushTransport),
    push: new RealDesktopChannelDeliverer(options.pushTransport),
    ...(options.channelDeliverers ?? {}),
  };

  const defaultRuntimeContribution = createNotificationRuntimeContribution({
    repository: notificationRepository,
    reliableAdapter,
    deliverer: options.channelDeliverer,
    delivererRegistry: defaultDeliverers,
    channelCapabilities: options.channelCapabilities,
    metricsService,
  });

  const durableRuntime = options.durableRuntime ?? defaultRuntimeContribution;

  return createNotificationModule({
    notificationRepository,
    preferenceRepository: new NotificationPreferencePrismaRepository(db),
    templateRepository: new NotificationTemplatePrismaRepository(db),
    closureChecker: options.closureChecker,
    durableRuntime,
    runtimeContributions: options.runtimeContributions ?? [durableRuntime],
    auditRepository: new PrismaOperationAuditRepository(db),
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
  closureChecker: (identityId: string) => Promise<boolean>,
): ScheduleNotificationPort {
  if (!closureChecker) {
    throw new Error('[FAIL-CLOSED] createNotificationPrismaScheduleNotificationPort requires closureChecker');
  }
  const repositories = createNotificationPrismaRepositories(db);
  const createNotification = new CreateNotificationUseCase(
    repositories.notificationRepository,
    repositories.notificationTemplateRepository,
    repositories.notificationPreferenceRepository,
    closureChecker,
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
