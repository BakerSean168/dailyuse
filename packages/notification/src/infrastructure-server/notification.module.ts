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
import {
  CreateNotification,
  MarkNotificationAsRead,
  GetUserNotifications,
  GetUnreadNotifications,
  GetNotificationPreference,
} from '../application-server';
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
  readonly createNotification: CreateNotification;
  readonly markAsRead: MarkNotificationAsRead;
  readonly getUserNotifications: GetUserNotifications;
  readonly getUnreadNotifications: GetUnreadNotifications;
  readonly getNotificationPreference: GetNotificationPreference;
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
    createNotification: new CreateNotification(
      notificationRepository,
      templateRepository,
      preferenceRepository,
    ),
    markAsRead: new MarkNotificationAsRead(notificationRepository),
    getUserNotifications: new GetUserNotifications(notificationRepository),
    getUnreadNotifications: new GetUnreadNotifications(notificationRepository),
    getNotificationPreference: new GetNotificationPreference(preferenceRepository),
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
  const { notificationRepository, preferenceRepository, templateRepository } = dependencies;
  const runtimeContributions = normalizeRuntimeContributions(dependencies.runtimeContributions);
  const useCases = createNotificationUseCases(dependencies);
  let started = false;

  // Build the transport-neutral application port.
  // 构建传输层无关的应用端口。
  //
  // Every method delegates to the assembled use cases or repository.
  // Methods without a dedicated use case return NOT_IMPLEMENTED so callers
  // never silently receive fake success.
  //
  // 每个方法都委托给已组装的用例或仓储。
  // 没有专门用例的方法返回 NOT_IMPLEMENTED，以避免调用方静默收到假成功。
  const api: NotificationApplicationPort = {
    // Delegate to CreateNotification use case.
    // 委托给 CreateNotification 用例。
    createNotification: async (data) => {
      const result = await useCases.createNotification.execute(data as any);
      return ok(result);
    },

    // Delegate to GetUserNotifications use case.
    // 委托给 GetUserNotifications 用例。
    listNotifications: async (query) => {
      const q = (query ?? {}) as {
        identityId?: string;
        includeRead?: boolean;
        limit?: number;
        offset?: number;
      };
      if (!q.identityId) {
        return fail({
          code: 'BAD_REQUEST',
          message: 'identityId is required for listing notifications / 列出通知需要 identityId',
        });
      }
      const result = await useCases.getUserNotifications.execute(q.identityId, {
        includeRead: q.includeRead,
        limit: q.limit,
        offset: q.offset,
      });
      return ok(result);
    },

    // Delegate to repository — no dedicated use case exists yet.
    // 委托给仓储 — 尚无专门的用例。
    getNotification: async (id) => {
      const notification = await notificationRepository.findById(id);
      return ok(notification);
    },

    // No updateNotification use case exists yet — surface NOT_IMPLEMENTED.
    // 尚无 updateNotification 用例 — 返回 NOT_IMPLEMENTED。
    updateNotification: async (_id, _data) => {
      return fail({
        code: 'NOT_IMPLEMENTED',
        message:
          'updateNotification use case is not implemented yet / updateNotification 用例尚未实现',
      });
    },

    // Delegate to repository — no dedicated use case exists yet.
    // 委托给仓储 — 尚无专门的用例。
    deleteNotification: async (id) => {
      await notificationRepository.delete(id);
      return ok(undefined);
    },

    markAsRead: async (id) => {
      await useCases.markAsRead.execute(id);
      return ok(undefined);
    },
    markAllAsRead: async (identityId) => {
      await useCases.markAsRead.executeAll(identityId);
      return ok({ count: 0 });
    },
    getUnreadCount: async (identityId) => {
      const count = await useCases.getUnreadNotifications.getCount(identityId);
      return ok({ count });
    },
    batchMarkAsRead: async (data) => {
      if (data.notificationIds?.length) {
        await useCases.markAsRead.executeMany(data.notificationIds);
      }
      return ok({ success: true, affected: data.notificationIds?.length ?? 0 });
    },
    batchDelete: async (data) => {
      // Delegate deletion per-ID through repository directly.
      // 通过仓储直接按 ID 委托删除。
      if (data.notificationIds?.length) {
        await notificationRepository.deleteMany(data.notificationIds);
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
      const pref = await useCases.getNotificationPreference.execute(identityId);
      return ok(pref);
    },

    // No updatePreferences use case exists yet — surface NOT_IMPLEMENTED.
    // 尚无 updatePreferences 用例 — 返回 NOT_IMPLEMENTED。
    updatePreferences: async (_dto) => {
      return fail({
        code: 'NOT_IMPLEMENTED',
        message:
          'updatePreferences use case is not implemented yet / updatePreferences 用例尚未实现',
      });
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
