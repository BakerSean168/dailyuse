/**
 * Notification runtime contributions for server transports.
 * 通知服务端传输层的运行时贡献。
 *
 * This file keeps side effects explicit and reversible.
 * Instead of globally registering initialization tasks via InitializationManager,
 * the notification module now owns its event subscriptions through a small
 * runtime object.
 *
 * 这个文件让副作用显式且可逆。
 * 通知模块不再通过 InitializationManager 全局注册初始化任务，
 * 而是通过一个轻量的 runtime 对象管理自身事件订阅生命周期。
 *
 * CRITICAL: This file preserves all cross-module event wiring that was
 * previously in initialization.ts (164 lines), specifically:
 * - `reminder:triggered` → dispatches in-app + desktop notifications
 * - `schedule:task:executed` → dispatches desktop + in-app notifications
 *
 * 关键：此文件保留了之前 initialization.ts（164 行）中的所有跨模块
 * 事件接线，特别是：
 * - `reminder:triggered` → 分发应用内 + 桌面通知
 * - `schedule:task:executed` → 分发桌面 + 应用内通知
 */

import { createLogger, generateUUID, eventBus } from '@dailyuse/utils';
import type {
  NotificationDispatchDesktopEvent,
  NotificationDispatchInAppEvent,
} from '@dailyuse/contracts/notification';
import { NotificationCategory, NotificationType } from '@dailyuse/contracts/notification';
import type { ReminderEventMap, NotificationChannel } from '@dailyuse/contracts/reminder';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';
import type { ScheduleEventMap } from '@dailyuse/contracts/schedule';
import { SourceModule, ExecutionStatus } from '@dailyuse/contracts/schedule';
import type { NotificationModuleRuntimeContribution } from '../infrastructure-server';

const logger = createLogger('NotificationRuntime');

/**
 * Runtime contribution contract used by module transports.
 * 模块传输层使用的运行时贡献契约。
 */
export type NotificationRuntimeContribution = NotificationModuleRuntimeContribution;

// ============ Event Handlers ============
// ============ 事件处理器 ============

/**
 * Handler for `reminder:triggered` events.
 * `reminder:triggered` 事件处理器。
 *
 * Converts reminder payloads into notification dispatch events.
 * When a reminder fires, we create an in-app and/or desktop notification
 * based on the reminder's notification config.
 *
 * 将提醒载荷转换为通知分发事件。
 * 当提醒触发时，根据提醒的通知配置创建应用内和/或桌面通知。
 */
function handleReminderTriggered(event: ReminderEventMap['reminder:triggered']): void {
  const reminder = event.reminder;
  if (!event.identityId || !reminder?.id) {
    logger.warn('[Notification] Missing reminder identity or id');
    return;
  }

  const title = reminder.notificationConfig?.title || reminder.name || 'Reminder';
  const body = reminder.notificationConfig?.body || reminder.description || null;
  const soundConfig = reminder.notificationConfig?.sound ?? null;
  const channels = reminder.notificationConfig?.channels ?? [];

  const base: NotificationDispatchDesktopEvent & NotificationDispatchInAppEvent = {
    id: generateUUID(),
    identityId: event.identityId,
    title,
    body,
    category: NotificationCategory.Reminder,
    type: NotificationType.Reminder,
    urgency: UrgencyLevel.High,
    importance: reminder.importanceLevel ?? ImportanceLevel.Moderate,
    data: {
      source: 'reminder:triggered',
      reminderId: reminder.id,
    },
    sound: soundConfig
      ? { enabled: !!soundConfig.enabled, name: soundConfig.soundName ?? null }
      : { enabled: true, name: null },
  };

  // Dispatch to in-app channel if no channels specified or InApp is included.
  // 如果未指定渠道或包含 InApp 则分发到应用内渠道。
  if (!channels.length || channels.includes('InApp')) {
    eventBus.send('notification:dispatch_in_app', base);
  }

  // Always dispatch to desktop channel for reminders.
  // 提醒通知始终分发到桌面渠道。
  eventBus.send('notification:dispatch_desktop', base);
}

/**
 * Handler for `schedule:task:executed` events.
 * `schedule:task:executed` 事件处理器。
 *
 * Converts schedule execution payloads into notification dispatch events.
 * Only fires for successful executions, mapping source module to the
 * appropriate notification category.
 *
 * 将计划执行载荷转换为通知分发事件。
 * 仅对成功的执行触发，将源模块映射到相应的通知类别。
 */
function handleScheduleExecuted(event: ScheduleEventMap['schedule:task:executed']): void {
  const identityId = event.payload?.identityId;
  if (!identityId) {
    logger.warn('[Notification] Missing identityId in schedule:task:executed');
    return;
  }

  // Only process successful executions.
  // 仅处理成功的执行。
  if (event.payload?.status && event.payload.status !== ExecutionStatus.Success) {
    return;
  }

  const payload = event.payload?.payload ?? {};
  const taskId = event.payload?.taskId;
  const sourceModule = event.payload?.sourceModule;
  const titleFallback =
    sourceModule === SourceModule.Goal
      ? 'Goal reminder'
      : sourceModule === SourceModule.Task
        ? 'Task reminder'
        : sourceModule === SourceModule.Reminder
          ? 'Reminder'
          : 'Schedule task';

  const title =
    (typeof payload['goalTitle'] === 'string' ? payload['goalTitle'] : undefined) ||
    (typeof payload['taskTitle'] === 'string' ? payload['taskTitle'] : undefined) ||
    (typeof payload['reminderTitle'] === 'string' ? payload['reminderTitle'] : undefined) ||
    titleFallback;

  const base: NotificationDispatchDesktopEvent & NotificationDispatchInAppEvent = {
    id: generateUUID(),
    identityId,
    title,
    body: null,
    category:
      sourceModule === SourceModule.Goal
        ? NotificationCategory.Goal
        : sourceModule === SourceModule.Task
          ? NotificationCategory.Task
          : sourceModule === SourceModule.Reminder
            ? NotificationCategory.Reminder
            : NotificationCategory.Schedule,
    type: NotificationType.Reminder,
    urgency: UrgencyLevel.Medium,
    importance: ImportanceLevel.Moderate,
    data: {
      source: 'schedule:task:executed',
      scheduleTaskId: taskId,
      sourceModule,
      payload,
    },
    sound: { enabled: true, name: null },
  };

  // Dispatch to both desktop and in-app channels.
  // 同时分发到桌面和应用内渠道。
  eventBus.send('notification:dispatch_desktop', base);
  eventBus.send('notification:dispatch_in_app', base);
}

// ============ Runtime Contribution Factory ============
// ============ 运行时贡献工厂 ============

/**
 * Creates an instance-owned runtime contribution.
 * 创建实例级 runtime 贡献对象。
 *
 * All event subscriptions are scoped to the returned object's lifecycle.
 * Calling `stop()` cleanly removes all listeners — no dangling references.
 *
 * 所有事件订阅都限定在返回对象的生命周期内。
 * 调用 `stop()` 会干净地移除所有监听器 — 不会留下悬挂引用。
 */
export function createNotificationRuntimeContribution(): NotificationRuntimeContribution {
  let started = false;

  return {
    start(): void {
      if (started) {
        return;
      }

      // Subscribe to cross-module events.
      // 订阅跨模块事件。
      eventBus.on('reminder:triggered', handleReminderTriggered);
      eventBus.on('schedule:task:executed', handleScheduleExecuted);

      started = true;
      logger.info('[Notification] Runtime contribution started');
    },

    stop(): void {
      if (!started) {
        return;
      }

      // Unsubscribe from all events.
      // 取消所有事件订阅。
      eventBus.off('reminder:triggered', handleReminderTriggered);
      eventBus.off('schedule:task:executed', handleScheduleExecuted);

      started = false;
      logger.info('[Notification] Runtime contribution stopped');
    },
  };
}
