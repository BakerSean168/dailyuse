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
} from '../domain-server/repositories';
import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import {
  CreateNotificationUseCase,
  MarkNotificationAsReadUseCase,
  GetUserNotificationsUseCase,
  GetUnreadNotificationsUseCase,
  GetNotificationPreferenceUseCase,
} from '../application-server';
import {
  toNotificationClientDTO,
  toNotificationPreferenceClientDTO,
} from '../application-server/use-cases/commands/notification-dto-converters';
import { NotificationChannelType } from '@dailyuse/contracts/notification';
import type { Result } from '@dailyuse/contracts/result';
import { ok, fail } from '@dailyuse/contracts/result';

// ============ Runtime Contribution Contract ============
// ============ 运行时贡献契约 ============

/**
 * Module-owned runtime side effects.
 * 模块拥有的运行时副作用。
 *
 * A contribution is the unit we start/stop together with the module instance.
 * This is the replacement for older global initialization hooks.
 * 一个贡献就是与模块实例一起启动/停止的单元。
 * 它替代了旧的全局初始化钩子。
 */
export interface NotificationModuleRuntimeContribution {
  start(): void;
  stop(): void;
}

export type NotificationRuntimeContributionsInput =
  | NotificationModuleRuntimeContribution
  | readonly NotificationModuleRuntimeContribution[];

// ============ Module Dependencies ============
// ============ 模块依赖 ============

/**
 * Everything the notification server runtime needs from the outside world.
 * 通知模块服务端运行时向外部索取的全部依赖。
 *
 * Refactor rule for other modules:
 * - only put ports or runtime contributions here
 * - never put transport objects (Express req/res, ipcMain, Router) here
 * - never hide these dependencies behind a singleton container
 *
 * 其他模块的重构规则：
 * - 只放端口或运行时贡献
 * - 不放传输层对象（Express req/res、ipcMain、Router）
 * - 不要把这些依赖隐藏在单例容器后面
 */
export interface NotificationModuleDependencies {
  readonly notificationRepository: INotificationRepository;
  readonly preferenceRepository: INotificationPreferenceRepository;
  readonly templateRepository: INotificationTemplateRepository;
  readonly db?: IElectronDatabase;
  readonly runtimeContributions?: NotificationRuntimeContributionsInput;
}

// ============ Assembled Use Cases ============
// ============ 已完成接线的用例集合 ============

/**
 * Lower-level assembled use cases.
 * 已完成接线的底层 use case 集合。
 *
 * Tests and low-level assembly sometimes need direct access to use-case objects,
 * but transports should prefer `NotificationApplicationPort`.
 * 测试和底层组装有时需要直接访问用例对象，
 * 但传输层应该优先使用 `NotificationApplicationPort`。
 */
export interface NotificationModuleUseCases {
  readonly createNotification: CreateNotificationUseCase;
  readonly markAsRead: MarkNotificationAsReadUseCase;
  readonly getUserNotifications: GetUserNotificationsUseCase;
  readonly getUnreadNotifications: GetUnreadNotificationsUseCase;
  readonly getNotificationPreference: GetNotificationPreferenceUseCase;
}

// ============ Application Port ============
// ============ 应用层门面 ============

/**
 * Transport-neutral callable application surface.
 * 传输层无关的可调用应用层门面。
 */
export interface NotificationApplicationPort {
  createNotification(data: unknown): Promise<Result<unknown>>;
  listNotifications(query: unknown): Promise<Result<unknown>>;
  getNotification(id: string): Promise<Result<unknown>>;
  updateNotification(id: string, data: unknown): Promise<Result<unknown>>;
  deleteNotification(id: string): Promise<Result<unknown>>;
  markAsRead(id: string): Promise<Result<unknown>>;
  markAllAsRead(identityId: string): Promise<Result<unknown>>;
  getUnreadCount(identityId: string): Promise<Result<unknown>>;
  batchMarkAsRead(data: { notificationIds?: string[] }): Promise<Result<unknown>>;
  batchDelete(data: { notificationIds?: string[] }): Promise<Result<unknown>>;
  cleanupOldNotifications(data: {
    identityId: string;
    beforeDays?: number;
    category?: string;
  }): Promise<Result<unknown>>;
  getPreferences(identityId: string): Promise<Result<unknown>>;
  updatePreferences(dto: unknown): Promise<Result<unknown>>;
}

// ============ Module Instance ============
// ============ 模块实例 ============

/**
 * Primary notification composition root return type.
 * 通知模块主组合根返回类型。
 *
 * `api` is the transport-facing surface.
 * `useCases` is kept for low-level tests and diagnostics.
 * `start` / `dispose` own runtime side effects.
 *
 * `api` 是面向传输层的表面。
 * `useCases` 为底层测试和诊断保留。
 * `start` / `dispose` 拥有运行时副作用的生命周期。
 */
export interface NotificationModuleInstance {
  readonly notificationRepository: INotificationRepository;
  readonly preferenceRepository: INotificationPreferenceRepository;
  readonly templateRepository: INotificationTemplateRepository;
  readonly useCases: NotificationModuleUseCases;
  readonly api: NotificationApplicationPort;
  start(): void;
  dispose(): void;
}

// ============ Assembly Helpers ============
// ============ 组装辅助函数 ============

/**
 * Pure assembly helper used by the composition root and tests.
 * 纯组装函数：给定依赖对象，返回已经接好线的 use case 集合。
 */
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
    markAsRead: new MarkNotificationAsReadUseCase(notificationRepository),
    getUserNotifications: new GetUserNotificationsUseCase(notificationRepository),
    getUnreadNotifications: new GetUnreadNotificationsUseCase(notificationRepository),
    getNotificationPreference: new GetNotificationPreferenceUseCase(preferenceRepository),
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

// ============ Composition Root ============
// ============ 组合根 ============

/**
 * Canonical composition root.
 * 规范化的通知模块主组合根。
 *
 * This follows the governance reference pattern. The expected reading order is:
 * 1. define `Dependencies`
 * 2. define transport-neutral `ApplicationPort`
 * 3. assemble use cases once
 * 4. wrap them in `api`
 * 5. let the module instance own `start` / `dispose`
 *
 * 遵循治理模块参考模式。推荐阅读顺序：
 * 1. 定义 `Dependencies`
 * 2. 定义传输层无关的 `ApplicationPort`
 * 3. 组装一次用例
 * 4. 用 `api` 包装
 * 5. 让模块实例拥有 `start` / `dispose`
 */
export function createNotificationModule(
  dependencies: NotificationModuleDependencies,
): NotificationModuleInstance {
  const { notificationRepository, preferenceRepository, templateRepository, db } = dependencies;
  const runtimeContributions = normalizeRuntimeContributions(dependencies.runtimeContributions);
  const useCases = createNotificationUseCases(dependencies);
  let started = false;

  // Build the transport-neutral application port.
  // 构建传输层无关的应用端口。
  //
  // Every method delegates to assembled use cases, repositories, or
  // direct persistence updates when a dedicated use case does not exist yet.
  //
  // 每个方法都委托给已组装的用例、仓储，或在缺少专门用例时直接执行持久化更新。
  const api: NotificationApplicationPort = {
    // Delegate to CreateNotification use case.
    // 委托给 CreateNotification 用例。
    createNotification: async (data) => {
      return useCases.createNotification.execute(data as Parameters<CreateNotificationUseCase['execute']>[0]);
    },

    // Delegate to GetUserNotifications use case.
    // 委托给 GetUserNotifications 用例。
    listNotifications: async (query) => {
      const q = (query ?? {}) as {
        identityId?: string;
        includeRead?: boolean;
        page?: number;
        limit?: number;
        offset?: number;
      };
      if (!q.identityId) {
        return fail({
          code: 'BAD_REQUEST',
          message: 'identityId is required for listing notifications / 列出通知需要 identityId',
        });
      }
      const limit = q.limit ?? 20;
      const offset = q.offset ?? Math.max(((q.page ?? 1) - 1) * limit, 0);
      const allResult = await useCases.getUserNotifications.execute(q.identityId, {
        includeRead: q.includeRead,
      });
      const pageResult = await useCases.getUserNotifications.execute(q.identityId, {
        includeRead: q.includeRead,
        limit,
        offset,
      });
      if (!allResult.ok) return allResult;
      if (!pageResult.ok) return pageResult;
      return ok({
        notifications: pageResult.data,
        total: allResult.data.length,
        page: q.page ?? 1,
        pageSize: limit,
        hasMore: offset + pageResult.data.length < allResult.data.length,
      });
    },

    // Read directly from the repository.
    // 直接从仓储读取。
    getNotification: async (id) => {
      const notification = await notificationRepository.findById(id);
      return ok(notification);
    },

    // Update through the persistence layer until a dedicated use case exists.
    // 在专门用例落地前，先通过持久化层完成更新。
    updateNotification: async (id, data) => {
      if (!db) {
        return fail({
          code: 'NOT_IMPLEMENTED',
          message: 'Notification updates require database access',
        });
      }
      const patch = (data ?? {}) as {
        title?: string;
        content?: string;
        status?: string;
        metadata?: Record<string, unknown>;
        expiresAt?: number | null;
      };
      const notification = await notificationRepository.findById(id);
      if (!notification) {
        return fail({ code: 'NOT_FOUND', message: 'notification not found' });
      }

      const current = notification.toServerDTO();
      await db.execute(
        `UPDATE notifications
            SET title = ?,
                content = ?,
                status = ?,
                metadata = ?,
                expires_at = ?,
                updated_at = ?
          WHERE id = ?`,
        [
          patch.title ?? current.title,
          patch.content ?? current.content,
          patch.status ?? current.status,
          JSON.stringify(patch.metadata ?? current.metadata ?? {}),
          patch.expiresAt ? new Date(patch.expiresAt).toISOString() : null,
          new Date().toISOString(),
          id,
        ],
      );

      const updated = await notificationRepository.findById(id);
      if (!updated) {
        return fail({ code: 'NOT_FOUND', message: 'notification not found after update' });
      }

      return ok(toNotificationClientDTO(updated.toServerDTO()));
    },

    // Delete directly through the repository.
    // 直接通过仓储删除。
    deleteNotification: async (id) => {
      const notification = await notificationRepository.findById(id);
      if (!notification) {
        return fail({ code: 'NOT_FOUND', message: 'notification not found' });
      }
      notification.softDelete();
      await notificationRepository.save(notification);
      return ok(undefined);
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
        const notifications = (
          await Promise.all(data.notificationIds.map((id) => notificationRepository.findById(id)))
        ).filter((notification): notification is NonNullable<typeof notification> => notification !== null);
        for (const notification of notifications) {
          notification.softDelete();
        }
        await notificationRepository.saveMany(notifications);
      }
      return ok({ success: true, affected: data.notificationIds?.length ?? 0 });
    },

    // Delegate to repository cleanupExpired — compute timestamp from beforeDays.
    // 委托给仓储 cleanupExpired — 从 beforeDays 计算时间戳。
    cleanupOldNotifications: async (data) => {
      const days = data.beforeDays ?? 30;
      const beforeTimestamp = Date.now() - days * 24 * 60 * 60 * 1000;
      const affected = await notificationRepository.cleanupExpired(beforeTimestamp);
      return ok({ success: true, affected });
    },

    // Delegate to GetNotificationPreference use case.
    // 委托给 GetNotificationPreference 用例。
    getPreferences: async (identityId) => {
      return useCases.getNotificationPreference.execute(identityId);
    },

    // Persist preference updates directly until a dedicated use case exists.
    // 在专门用例落地前，直接持久化偏好更新。
    updatePreferences: async (dto) => {
      if (!db) {
        return fail({
          code: 'NOT_IMPLEMENTED',
          message: 'Preference updates require database access',
        });
      }
      const input = (dto ?? {}) as {
        identityId?: string;
        enabled?: boolean;
        channels?: { inApp?: boolean; email?: boolean; push?: boolean; sms?: boolean };
        categories?: Record<string, Record<string, boolean>>;
        doNotDisturb?: unknown;
        rateLimit?: unknown;
      };
      if (!input.identityId) {
        return fail({ code: 'BAD_REQUEST', message: 'identityId is required' });
      }

      const preference = await preferenceRepository.getOrCreate(input.identityId);
      const channelMap = {
        inApp: NotificationChannelType.InApp,
        email: NotificationChannelType.Email,
        push: NotificationChannelType.Push,
        sms: NotificationChannelType.Sms,
      } as const;

      const categories = input.categories ?? {};
      for (const [moduleName, value] of Object.entries(categories)) {
        const channels = Object.entries(channelMap)
          .filter(([key]) => Boolean(value?.[key as keyof typeof value]))
          .map(([, channel]) => channel);
        preference.setModuleChannels(moduleName, input.enabled === false ? [] : channels);
      }

      if (input.channels && Object.keys(categories).length === 0) {
        const fallbackChannels = Object.entries(channelMap)
          .filter(([key]) => Boolean(input.channels?.[key as keyof typeof input.channels]))
          .map(([, channel]) => channel);
        for (const moduleName of ['task', 'goal', 'schedule', 'reminder', 'account', 'system']) {
          preference.setModuleChannels(moduleName, input.enabled === false ? [] : fallbackChannels);
        }
      }

      await preferenceRepository.save(preference);
      await db.execute(
        `UPDATE notification_preferences
            SET enabled = ?,
                channels = ?,
                categories = ?,
                do_not_disturb = ?,
                rate_limit = ?,
                updated_at = ?
          WHERE identity_id = ?`,
        [
          input.enabled === false ? 0 : 1,
          JSON.stringify(input.channels ?? null),
          JSON.stringify(input.categories ?? null),
          JSON.stringify(input.doNotDisturb ?? null),
          JSON.stringify(input.rateLimit ?? null),
          new Date().toISOString(),
          input.identityId,
        ],
      );

      const updated = await preferenceRepository.getOrCreate(input.identityId);
      return ok(toNotificationPreferenceClientDTO(updated.toServerDTO()));
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
