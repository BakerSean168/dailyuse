/**
 * Notification Module Exports
 * 通知模块 - 统一导出
 */

// ============ Aggregates ============
export * from './aggregates';

// ============ Entities ============
export * from './entities';

// ============ Value Objects ============
export * from './value-objects';

// ============ Domain Events ============
export * from './domain/events';

// ============ Protocol ============
export * from './protocol';
export type {
  NotificationDispatchBase,
  NotificationDispatchDesktopEvent,
  NotificationDispatchInAppEvent,
} from './protocol';

// ============ API ============
export * from './api';
