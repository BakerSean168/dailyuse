/**
 * Notification 模块事件系统
 * @description 定义通知模块的事件类型和发布函数
 */

import { eventBus } from '@dailyuse/utils';
import type {
  NotificationConfig,
  NotificationEventPayload,
  ReminderTriggeredPayload,
  NotificationPermission,
  NotificationServiceConfig,
} from '../../application/types';

/**
 * 通知模块事件常量
 */
export const NOTIFICATION_EVENTS = {
  // === 提醒触发事件（监听Schedule模块） ===
  REMINDER_TRIGGERED: 'notification:reminder-triggered',

  // === 通知生命周期事件 ===
  NOTIFICATION_CREATED: 'notification:created',
  NOTIFICATION_SHOWN: 'notification:shown',
  NOTIFICATION_CLICKED: 'notification:clicked',
  NOTIFICATION_CLOSED: 'notification:closed',
  NOTIFICATION_DISMISSED: 'notification:dismissed',
  NOTIFICATION_FAILED: 'notification:failed',

  // === 权限管理事件 ===
  PERMISSION_REQUESTED: 'notification:permission-requested',
  PERMISSION_GRANTED: 'notification:permission-granted',
  PERMISSION_DENIED: 'notification:permission-denied',
  PERMISSION_CHANGED: 'notification:permission-changed',

  // === 配置管理事件 ===
  CONFIG_UPDATED: 'notification:config-updated',
  SOUND_ENABLED: 'notification:sound-enabled',
  SOUND_DISABLED: 'notification:sound-disabled',
  DESKTOP_ENABLED: 'notification:desktop-enabled',
  DESKTOP_DISABLED: 'notification:desktop-disabled',

  // === 勿扰模式事件 ===
  DND_ENABLED: 'notification:dnd-enabled',
  DND_DISABLED: 'notification:dnd-disabled',
  DND_SCHEDULE_UPDATED: 'notification:dnd-schedule-updated',

  // === 系统事件 ===
  QUEUE_FULL: 'notification:queue-full',
  QUEUE_CLEARED: 'notification:queue-cleared',
  SERVICE_INITIALIZED: 'notification:service-initialized',
  SERVICE_DESTROYED: 'notification:service-destroyed',

  // === 错误事件 ===
  ERROR: 'notification:error',
  SOUND_ERROR: 'notification:sound-error',
  DESKTOP_ERROR: 'notification:desktop-error',
} as const;

/**
 * Schedule模块事件常量（监听用）
 */
export const SCHEDULE_EVENTS = {
  // 提醒触发事件
  REMINDER_TRIGGERED: 'schedule:reminder-triggered',
  TASK_REMINDER_TRIGGERED: 'schedule:task-reminder-triggered',
  GOAL_REMINDER_TRIGGERED: 'schedule:goal-reminder-triggered',
  CUSTOM_REMINDER_TRIGGERED: 'schedule:custom-reminder-triggered',
} as const;

// =============== 事件载荷类型 ===============

/**
 * 通知创建事件载荷
 */
export interface NotificationCreatedPayload {
  notification: NotificationConfig;
  queuePosition: number;
  timestamp: Date;
  source?: string;
}

/**
 * 通知显示事件载荷
 */
export interface NotificationShownPayload {
  notification: NotificationConfig;
  displayMethod: 'desktop' | 'in-app';
  duration?: number;
  timestamp: Date;
  source?: string;
}

/**
 * 通知交互事件载荷
 */
export interface NotificationInteractionPayload {
  notification: NotificationConfig;
  actionId?: string;
  userAgent: string;
  timestamp: Date;
  source?: string;
}

/**
 * 权限变更事件载荷
 */
export interface PermissionChangedPayload {
  oldPermission: NotificationPermission;
  newPermission: NotificationPermission;
  timestamp: Date;
}

/**
 * 配置更新事件载荷
 */
export interface ConfigUpdatedPayload {
  oldConfig: NotificationServiceConfig;
  newConfig: NotificationServiceConfig;
  changedFields: string[];
  timestamp: Date;
}

/**
 * 错误事件载荷
 */
export interface NotificationErrorPayload {
  error: Error;
  context: string;
  notificationId?: string;
  timestamp: Date;
  recoverable: boolean;
}

// =============== 事件发布函数 ===============

/**
 * 发布提醒触发事件（供Schedule模块调用）
 */
export function publishReminderTriggered(payload: ReminderTriggeredPayload): void {
  console.log('[NotificationEvents] 发布提醒触发事件:', payload.reminderId);
  eventBus.emit(NOTIFICATION_EVENTS.REMINDER_TRIGGERED, payload);
}

/**
 * 发布通知创建事件
 */
export function publishNotificationCreated(
  notification: NotificationConfig,
  queuePosition: number,
): void {
  const payload: NotificationCreatedPayload = {
    notification,
    queuePosition,
    timestamp: new Date(),
  };

  eventBus.emit(NOTIFICATION_EVENTS.NOTIFICATION_CREATED, payload);
}

/**
 * 发布通知显示事件
 */
export function publishNotificationShown(
  notification: NotificationConfig,
  displayMethod: 'desktop' | 'in-app',
  duration?: number,
): void {
  const payload: NotificationShownPayload = {
    notification,
    displayMethod,
    duration,
    timestamp: new Date(),
  };

  eventBus.emit(NOTIFICATION_EVENTS.NOTIFICATION_SHOWN, payload);
}

/**
 * 发布通知点击事件
 */
export function publishNotificationClicked(
  notification: NotificationConfig,
  actionId?: string,
): void {
  const payload: NotificationInteractionPayload = {
    notification,
    actionId,
    userAgent: navigator.userAgent,
    timestamp: new Date(),
  };

  eventBus.emit(NOTIFICATION_EVENTS.NOTIFICATION_CLICKED, payload);
}

/**
 * 发布通知关闭事件
 */
export function publishNotificationClosed(notification: NotificationConfig): void {
  const payload: NotificationEventPayload = {
    notification,
    timestamp: new Date(),
  };

  eventBus.emit(NOTIFICATION_EVENTS.NOTIFICATION_CLOSED, payload);
}

/**
 * 发布通知失败事件
 */
export function publishNotificationFailed(notification: NotificationConfig, error: Error): void {
  const payload: NotificationEventPayload = {
    notification,
    error,
    timestamp: new Date(),
  };

  eventBus.emit(NOTIFICATION_EVENTS.NOTIFICATION_FAILED, payload);
}

/**
 * 发布权限变更事件
 */
export function publishPermissionChanged(
  oldPermission: NotificationPermission,
  newPermission: NotificationPermission,
): void {
  const payload: PermissionChangedPayload = {
    oldPermission,
    newPermission,
    timestamp: new Date(),
  };

  eventBus.emit(NOTIFICATION_EVENTS.PERMISSION_CHANGED, payload);
}

/**
 * 发布配置更新事件
 */
export function publishConfigUpdated(
  oldConfig: NotificationServiceConfig,
  newConfig: NotificationServiceConfig,
  changedFields: string[],
): void {
  const payload: ConfigUpdatedPayload = {
    oldConfig,
    newConfig,
    changedFields,
    timestamp: new Date(),
  };

  eventBus.emit(NOTIFICATION_EVENTS.CONFIG_UPDATED, payload);
}

/**
 * 发布勿扰模式启用事件
 */
export function publishDndEnabled(): void {
  eventBus.emit(NOTIFICATION_EVENTS.DND_ENABLED, { timestamp: new Date() });
}

/**
 * 发布勿扰模式禁用事件
 */
export function publishDndDisabled(): void {
  eventBus.emit(NOTIFICATION_EVENTS.DND_DISABLED, { timestamp: new Date() });
}

/**
 * 发布通知错误事件
 */
export function publishNotificationError(
  error: Error,
  context: string,
  notificationId?: string,
  recoverable: boolean = false,
): void {
  const payload: NotificationErrorPayload = {
    error,
    context,
    notificationId,
    recoverable,
    timestamp: new Date(),
  };

  console.error('[NotificationEvents] 通知错误:', payload);
  eventBus.emit(NOTIFICATION_EVENTS.ERROR, payload);
}

/**
 * 发布队列已满事件
 */
export function publishQueueFull(queueSize: number): void {
  eventBus.emit(NOTIFICATION_EVENTS.QUEUE_FULL, {
    queueSize,
    timestamp: new Date(),
  });
}

/**
 * 发布服务初始化完成事件
 */
export function publishServiceInitialized(): void {
  console.log('[NotificationEvents] 通知服务已初始化');
  eventBus.emit(NOTIFICATION_EVENTS.SERVICE_INITIALIZED, {
    timestamp: new Date(),
  });
}

// =============== 事件监听辅助函数 ===============

/**
 * 监听提醒触发事件
 */
export function onReminderTriggered(
  handler: (payload: ReminderTriggeredPayload) => void | Promise<void>,
): void {
  eventBus.on(NOTIFICATION_EVENTS.REMINDER_TRIGGERED, handler);
}

/**
 * 监听Schedule模块的提醒触发事件
 */
export function onScheduleReminderTriggered(
  handler: (payload: ReminderTriggeredPayload) => void | Promise<void>,
): void {
  // 监听多种Schedule事件
  eventBus.on(SCHEDULE_EVENTS.REMINDER_TRIGGERED, handler);
  eventBus.on(SCHEDULE_EVENTS.TASK_REMINDER_TRIGGERED, handler);
  eventBus.on(SCHEDULE_EVENTS.GOAL_REMINDER_TRIGGERED, handler);
  eventBus.on(SCHEDULE_EVENTS.CUSTOM_REMINDER_TRIGGERED, handler);
}

/**
 * 移除所有通知事件监听器
 */
export function removeNotificationEventListeners(): void {
  // 移除通知模块事件监听
  Object.values(NOTIFICATION_EVENTS).forEach((event) => {
    eventBus.off(event);
  });

  // 移除Schedule模块事件监听
  Object.values(SCHEDULE_EVENTS).forEach((event) => {
    eventBus.off(event);
  });

  console.log('[NotificationEvents] 已移除所有通知事件监听器');
}
