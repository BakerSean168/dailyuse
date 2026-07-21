/**
 * createNotificationModule — explicit composition root for the notification server runtime.
 * createNotificationModule —— 通知模块服务端运行时的显式组合根。
 *
 * The outer app selects concrete adapters and passes them in here.
 * This module then assembles the application layer exactly once and exposes a
 * stable facade to HTTP / IPC transports.
 *
 * 外层应用负责选择具体适配器并传入这里。
 * 组合根只做一次组装，然后向 HTTP / IPC 等传输层暴露稳定门面。
 *
 * Notification follows the governance reference pattern: one composition root
 * per module, constructor injection only, no hidden service locator.
 * 通知模块遵循治理模块参考模式：每个模块一个组合根，
 * 仅使用构造函数注入，不使用隐藏的服务定位器。
 */

import type {
  INotificationRepository,
  INotificationPreferenceRepository,
  INotificationTemplateRepository,
} from '../domain/repositories';
import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import {
  CreateNotificationUseCase,
  MarkNotificationAsReadUseCase,
  UpdateNotificationUseCase,
  UpdateNotificationPreferenceUseCase,
  GetUserNotificationsUseCase,
  GetUnreadNotificationsUseCase,
  GetNotificationPreferenceUseCase,
} from '../application';
import { ok } from '@dailyuse/contracts/result';
import {
  NotificationMaintenanceApplicationService,
  NotificationQueryApplicationService,
} from '../application';
import type { NotificationApplicationPort } from '../application';

export interface NotificationModuleRuntimeContribution {
  start(): void;
  stop(): void;
}

export type NotificationRuntimeContributionsInput =
  | NotificationModuleRuntimeContribution
  | readonly NotificationModuleRuntimeContribution[];

export interface NotificationModuleDependencies {
  readonly notificationRepository: INotificationRepository;
  readonly preferenceRepository: INotificationPreferenceRepository;
  readonly templateRepository: INotificationTemplateRepository;
  readonly db?: IElectronDatabase;
  readonly runtimeContributions?: NotificationRuntimeContributionsInput;
}

export interface NotificationModuleUseCases {
  readonly createNotification: CreateNotificationUseCase;
  readonly updateNotification: UpdateNotificationUseCase;
  readonly markAsRead: MarkNotificationAsReadUseCase;
  readonly getUserNotifications: GetUserNotificationsUseCase;
  readonly getUnreadNotifications: GetUnreadNotificationsUseCase;
  readonly getNotificationPreference: GetNotificationPreferenceUseCase;
  readonly updateNotificationPreference: UpdateNotificationPreferenceUseCase;
}

export interface NotificationModuleInstance {
  readonly notificationRepository: INotificationRepository;
  readonly preferenceRepository: INotificationPreferenceRepository;
  readonly templateRepository: INotificationTemplateRepository;
  readonly useCases: NotificationModuleUseCases;
  readonly api: NotificationApplicationPort;
  start(): void;
  dispose(): void;
}

export function createNotificationUseCases(
  deps: NotificationModuleDependencies,
): NotificationModuleUseCases {
  const { notificationRepository, preferenceRepository, templateRepository } = deps;

  return {
    createNotification: new CreateNotificationUseCase(
      notificationRepository,
      templateRepository,
      preferenceRepository,
    ),
    updateNotification: new UpdateNotificationUseCase(notificationRepository),
    markAsRead: new MarkNotificationAsReadUseCase(notificationRepository),
    getUserNotifications: new GetUserNotificationsUseCase(notificationRepository),
    getUnreadNotifications: new GetUnreadNotificationsUseCase(notificationRepository),
    getNotificationPreference: new GetNotificationPreferenceUseCase(preferenceRepository),
    updateNotificationPreference: new UpdateNotificationPreferenceUseCase(preferenceRepository),
  };
}

function normalizeRuntimeContributions(
  runtimeContributions?:
    | NotificationModuleRuntimeContribution
    | ReadonlyArray<NotificationModuleRuntimeContribution>,
): readonly NotificationModuleRuntimeContribution[] {
  if (!runtimeContributions) {
    return [];
  }

  if (Array.isArray(runtimeContributions)) {
    return Array.from(runtimeContributions);
  }

  return [runtimeContributions as NotificationModuleRuntimeContribution];
}

export function createNotificationModule(
  dependencies: NotificationModuleDependencies,
): NotificationModuleInstance {
  const { notificationRepository, preferenceRepository, templateRepository } = dependencies;
  const runtimeContributions = normalizeRuntimeContributions(dependencies.runtimeContributions);
  const useCases = createNotificationUseCases(dependencies);
  const notificationQueryApplicationService = new NotificationQueryApplicationService(
    notificationRepository,
  );
  const notificationMaintenanceApplicationService = new NotificationMaintenanceApplicationService(
    notificationRepository,
  );
  let started = false;

  const api: NotificationApplicationPort = {
    createNotification: async (data) => {
      return useCases.createNotification.execute(
        data as Parameters<CreateNotificationUseCase['execute']>[0],
      );
    },

    listNotifications: async (query) => {
      return notificationQueryApplicationService.listNotifications(
        query as Parameters<NotificationQueryApplicationService['listNotifications']>[0],
      );
    },

    getNotification: async (id) => {
      return notificationQueryApplicationService.getNotification(id);
    },

    updateNotification: async (id, data) => {
      return useCases.updateNotification.execute(
        id,
        data as Parameters<UpdateNotificationUseCase['execute']>[1],
      );
    },

    deleteNotification: async (id) => {
      return notificationMaintenanceApplicationService.deleteNotification(id);
    },

    markAsRead: async (id) => {
      return useCases.markAsRead.execute(id);
    },

    markAllAsRead: async (identityId) => {
      return useCases.markAsRead.executeAll(identityId);
    },

    getUnreadCount: async (identityId) => {
      return useCases.getUnreadNotifications.getCount(identityId);
    },

    batchMarkAsRead: async (data) => {
      if (data.notificationIds?.length) {
        return useCases.markAsRead.executeMany(data.notificationIds);
      }
      return ok(0);
    },

    batchDelete: async (data) => {
      if (data.notificationIds?.length) {
        return notificationMaintenanceApplicationService.batchDelete(
          data as Parameters<NotificationMaintenanceApplicationService['batchDelete']>[0],
        );
      }
      return ok({ deletedCount: 0 });
    },

    cleanupOldNotifications: async (data) => {
      return notificationMaintenanceApplicationService.cleanupOldNotifications({
        identityId: data.identityId,
        beforeDays: data.beforeDays ?? 30,
        category: data.category as Parameters<
          NotificationMaintenanceApplicationService['cleanupOldNotifications']
        >[0]['category'],
      });
    },

    getPreferences: async (identityId) => {
      return useCases.getNotificationPreference.execute(identityId);
    },

    updatePreferences: async (dto) => {
      return useCases.updateNotificationPreference.execute(
        dto as Parameters<UpdateNotificationPreferenceUseCase['execute']>[0],
      );
    },
  };

  return {
    notificationRepository,
    preferenceRepository,
    templateRepository,
    useCases,
    api,
    start(): void {
      if (started) {
        return;
      }

      for (const runtime of runtimeContributions) {
        runtime.start();
      }

      started = true;
    },
    dispose(): void {
      if (!started) {
        return;
      }

      for (const runtime of [...runtimeContributions].reverse()) {
        runtime.stop();
      }

      started = false;
    },
  };
}
