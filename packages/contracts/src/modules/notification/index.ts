/**
 * Notification Module Exports
 * 通知模块 - 简化导出
 *
 * ImportanceLevel 和 UrgencyLevel 从 @dailyuse/contracts/shared 导入
 */

// ============ Protocol ============
export * from './protocol';
export type {
  NotificationDispatchBase,
  NotificationDispatchDesktopEvent,
  NotificationDispatchInAppEvent,
} from './protocol';

// ============ Value Objects ============
export * from './value-objects';

// ============ Entities ============
export * from './entities';

// ============ Aggregates ============
export * from './aggregates';

// ============ API ============
export * from './api';
