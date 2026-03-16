/**
 * Notification PowerSync module — convenience factory.
 * 通知 PowerSync 模块 — 便捷工厂。
 *
 * Creates a NotificationModuleInstance pre-wired with PowerSync repositories.
 * Used by the Electron entry point for desktop database access.
 *
 * 创建预先绑定 PowerSync 仓储的 NotificationModuleInstance。
 * 由 Electron 入口点用于桌面数据库访问。
 */

import {
  createNotificationModule,
  type NotificationModuleInstance,
  type NotificationRuntimeContributionsInput,
} from './notification.module';
import {
  PowerSyncNotificationRepository,
  PowerSyncNotificationPreferenceRepository,
  PowerSyncNotificationTemplateRepository,
} from './adapters/powersync';
import type { IElectronDatabase } from '@dailyuse/contracts/electron';

/**
 * Creates a notification module instance backed by PowerSync repositories.
 * 创建由 PowerSync 仓储支持的通知模块实例。
 *
 * Optionally accepts runtime contributions so callers (e.g. Electron entry)
 * can pass event-wiring side effects into the module's lifecycle.
 * The module's `start()` / `dispose()` will properly start/stop them.
 *
 * 可选地接受运行时贡献，以便调用方（如 Electron 入口）
 * 将事件接线副作用传入模块生命周期。
 * 模块的 `start()` / `dispose()` 会正确地启动/停止它们。
 */
export function createNotificationPowerSyncModule(
  db: IElectronDatabase,
  runtimeContributions?: NotificationRuntimeContributionsInput,
): NotificationModuleInstance {
  return createNotificationModule({
    notificationRepository: new PowerSyncNotificationRepository(db),
    preferenceRepository: new PowerSyncNotificationPreferenceRepository(db),
    templateRepository: new PowerSyncNotificationTemplateRepository(db),
    runtimeContributions,
  });
}

// Re-export adapters for consumers that need direct access.
// 为需要直接访问的消费者重新导出适配器。
export {
  PowerSyncNotificationRepository,
  PowerSyncNotificationPreferenceRepository,
  PowerSyncNotificationTemplateRepository,
};
