/**
 * Notification 模块事件处理器
 * @description 监听Schedule模块的提醒触发事件，处理系统级通知
 */

import { eventBus, createLogger } from '@dailyuse/utils';
import { NotificationService } from '../services/NotificationService';

import {
  NotificationType,
  NotificationPriority,
  NotificationMethod,
  SoundType,
} from '../../application/types';

import type { ReminderTriggeredPayload, NotificationConfig, SoundConfig } from '../../application/types';

import {
  NOTIFICATION_EVENTS,
  SCHEDULE_EVENTS,
  onReminderTriggered,
  onScheduleReminderTriggered,
} from '../events/notificationEvents';

const logger = createLogger('NotificationEventHandlers');

/**
 * Notification模块事件处理器
 */
export class NotificationEventHandlers {
  private notificationService: NotificationService;
  private isInitialized = false;

  constructor() {
    this.notificationService = NotificationService.getInstance();
  }

  /**
   * 初始化事件监听器
   */
  initializeEventHandlers(): void {
    if (this.isInitialized) {
      logger.warn('事件处理器已初始化，忽略重复调用');
      return;
    }

    console.log('[NotificationEventHandlers] 🚀 开始初始化事件监听器...');
    logger.info('开始初始化事件处理器');

    // 监听Schedule模块的提醒触发事件
    this.setupScheduleEventListeners();

    // 监听Notification模块内部事件
    this.setupInternalEventListeners();

    // 监听系统事件
    this.setupSystemEventListeners();

    this.isInitialized = true;
    console.log('[NotificationEventHandlers] ✅ 事件处理器初始化完成');
    logger.info('事件处理器初始化完成', {
      scheduledListeners: true,
      internalListeners: true,
      systemListeners: true,
    });
  }

  /**
   * 设置Schedule模块事件监听器
   * 统一监听 reminder-triggered 事件，通过 sourceType 区分类型
   */
  private setupScheduleEventListeners(): void {
    logger.debug('设置Schedule事件监听器');

    // ⚠️ 注意：此处理器已被 ReminderNotificationHandler 替代
    // ReminderNotificationHandler 专门处理 SSE 提醒事件
    // NotificationEventHandlers 保留用于监控和调试

    // 统一监听 reminder-triggered 事件（推荐方式）
    eventBus.on('reminder-triggered', async (payload: any) => {
      logger.info('收到统一提醒事件', {
        reminderId: payload.reminderId || payload.id,
        sourceType: payload.sourceType || payload.type,
        title: payload.title,
        hasMessage: !!payload.message,
        hasAlertMethods: !!payload.alertMethods,
      });

      // 标准化数据格式
      const standardPayload = this.normalizeReminderPayload(payload);

      // 根据来源类型处理（已被 ReminderNotificationHandler 处理，此处仅记录）
      logger.debug('提醒类型已标准化', {
        sourceType: standardPayload.sourceType,
        priority: standardPayload.priority,
        methods: standardPayload.methods,
        note: '实际处理由 ReminderNotificationHandler 完成',
      });
    });
  }

  /**
   * 设置内部事件监听器
   */
  private setupInternalEventListeners(): void {
    logger.debug('设置内部事件监听器');

    // 监听通知创建事件（用于统计和日志）
    eventBus.on(NOTIFICATION_EVENTS.NOTIFICATION_CREATED, (payload) => {
      logger.info('通知已创建', {
        notificationId: payload.notification.id,
        type: payload.notification.type,
        priority: payload.notification.priority,
        queuePosition: payload.queuePosition,
      });
    });

    // 监听通知显示事件
    eventBus.on(NOTIFICATION_EVENTS.NOTIFICATION_SHOWN, (payload) => {
      logger.info('通知已显示', {
        notificationId: payload.notification.id,
        displayMethod: payload.displayMethod,
        duration: payload.duration,
        title: payload.notification.title,
      });
    });

    // 监听通知点击事件
    eventBus.on(NOTIFICATION_EVENTS.NOTIFICATION_CLICKED, (payload) => {
      logger.info('通知被点击', {
        notificationId: payload.notification.id,
        actionId: payload.actionId,
        hasAction: !!payload.actionId,
        timestamp: payload.timestamp,
      });
    });

    // 监听权限变更事件
    eventBus.on(NOTIFICATION_EVENTS.PERMISSION_CHANGED, (payload) => {
      logger.info('通知权限变更', {
        from: payload.oldPermission,
        to: payload.newPermission,
        grantedAt: payload.grantedAt,
      });
    });

    // 监听配置更新事件
    eventBus.on(NOTIFICATION_EVENTS.CONFIG_UPDATED, (payload) => {
      logger.info('通知配置已更新', {
        changedFields: payload.changedFields,
        updatedConfig: payload.config,
      });
    });

    // 监听错误事件
    eventBus.on(NOTIFICATION_EVENTS.ERROR, (payload) => {
      logger.error('通知错误', {
        errorMessage: payload.error.message,
        errorCode: payload.error.code,
        context: payload.context,
        stack: payload.error.stack,
      });
    });
  }

  /**
   * 设置系统事件监听器
   */
  private setupSystemEventListeners(): void {
    console.log('[NotificationEventHandlers] 📋 设置系统事件监听器...');
    logger.debug('设置系统事件监听器');

    // 🔔 监听 SSE 推送的弹窗提醒事件
    console.log('[NotificationEventHandlers] 注册 ui:show-popup-reminder 监听器');
    eventBus.on('ui:show-popup-reminder', (data: any) => {
      console.log('[NotificationEventHandlers] 🔔 收到弹窗提醒事件！！！', data);
      logger.info('收到弹窗提醒事件', {
        accountUuid: data?.notification?.accountUuid,
        title: data?.notification?.title,
        notificationUuid: data?.notification?.uuid,
      });

      // 显示应用内弹窗通知
      eventBus.emit('notification:in-app', {
        notification: data.notification,
        timestamp: data.timestamp,
      });
    });

    // 🔊 监听 SSE 推送的提醒音效播放事件
    console.log('[NotificationEventHandlers] 注册 ui:play-reminder-sound 监听器');
    eventBus.on('ui:play-reminder-sound', (data: any) => {
      console.log('[NotificationEventHandlers] 🔊 收到提醒音效播放事件！！！', data);
      logger.info('收到提醒音效播放事件', {
        accountUuid: data?.notification?.accountUuid,
        sound: data?.sound,
      });

      // 播放提醒音效
      const soundConfig: SoundConfig = {
        enabled: true,
        type: SoundType.REMINDER,
        volume: data?.sound?.volume || 0.7,
      };

      const notificationId = `reminder-sound-${data.notification?.uuid || Date.now()}`;

      this.notificationService
        .getAudioService()
        .play(soundConfig, notificationId)
        .then(() => {
          logger.info('提醒音效播放完成', { notificationId });
        })
        .catch((error: unknown) => {
          logger.error('提醒音效播放失败', {
            notificationId,
            error: error instanceof Error ? error.message : String(error),
          });
        });
    });

    // 📢 监听 SSE 推送的系统通知事件
    eventBus.on('system:show-notification', (data: any) => {
      logger.info('收到系统通知事件', {
        accountUuid: data?.notification?.accountUuid,
        title: data?.notification?.title,
        notificationUuid: data?.notification?.uuid,
      });

      // 检查系统通知权限
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const notification = new Notification(data.notification.title, {
          body: data.notification.content || data.notification.title,
          icon: '/favicon.ico',
          tag: `notification-${data.notification.uuid}`,
          requireInteraction: data.notification.importance === 'high' || data.notification.urgency === 'high',
        });

        notification.onclick = () => {
          logger.info('系统通知被点击', {
            notificationUuid: data.notification.uuid,
          });
          // 可以导航到相关页面
          window.focus();
          notification.close();
        };

        logger.info('系统通知已显示', {
          notificationUuid: data.notification.uuid,
        });
      } else {
        logger.warn('系统通知权限未授予，无法显示系统通知', {
          permission: typeof Notification !== 'undefined' ? Notification.permission : 'not-supported',
        });
      }
    });

    // 监听用户登出事件
    eventBus.on('auth:user-logged-out', () => {
      logger.info('用户登出，清理所有通知');
      this.notificationService.dismissAll();
    });

    // 监听应用失去焦点事件
    window.addEventListener('blur', () => {
      logger.debug('应用失去焦点');
    });

    // 监听应用获得焦点事件
    window.addEventListener('focus', () => {
      logger.debug('应用获得焦点');
    });

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        logger.debug('页面已隐藏');
      } else {
        logger.debug('页面已显示');
      }
    });
  }

  /**
   * 处理提醒触发事件
   */
  private async handleReminderTriggered(payload: ReminderTriggeredPayload): Promise<void> {
    try {
      logger.info('处理提醒触发事件', {
        reminderId: payload.reminderId,
        sourceType: payload.sourceType,
        sourceId: payload.sourceId,
        title: payload.title,
        priority: payload.priority,
        methods: payload.methods,
      });

      // 创建通知配置
      const notificationConfig = this.createNotificationFromReminder(payload);

      logger.debug('通知配置已创建', {
        notificationId: notificationConfig.id,
        type: notificationConfig.type,
        methods: notificationConfig.methods,
        soundEnabled: notificationConfig.sound?.enabled,
      });

      // 显示通知
      await this.notificationService.show(notificationConfig);

      logger.info('提醒通知已显示', {
        notificationId: notificationConfig.id,
        title: notificationConfig.title,
      });
    } catch (error) {
      logger.error('处理提醒触发失败', {
        reminderId: payload.reminderId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  /**
   * 根据来源类型增强提醒配置
   * 不同类型的提醒有不同的默认配置
   */
  private enhanceBySourceType(payload: ReminderTriggeredPayload): ReminderTriggeredPayload {
    switch (payload.sourceType) {
      case 'task':
        // 任务提醒：高优先级，桌面+声音
        return {
          ...payload,
          priority: payload.priority || NotificationPriority.HIGH,
          methods: payload.methods || [NotificationMethod.DESKTOP, NotificationMethod.SOUND],
        };

      case 'goal':
        // 目标提醒：普通优先级，桌面+声音
        return {
          ...payload,
          priority: payload.priority || NotificationPriority.NORMAL,
          methods: payload.methods || [NotificationMethod.DESKTOP, NotificationMethod.SOUND],
        };

      case 'reminder':
        // 普通提醒：根据配置决定
        return {
          ...payload,
          priority: payload.priority || NotificationPriority.NORMAL,
          methods: payload.methods || [NotificationMethod.DESKTOP],
        };

      case 'custom':
        // 自定义提醒：保持原有配置
        return payload;

      default:
        logger.warn('未知的提醒类型', {
          sourceType: payload.sourceType,
          willUseDefaultConfig: true,
        });
        return payload;
    }
  }

  /**
   * 从提醒载荷创建通知配置
   */
  private createNotificationFromReminder(payload: ReminderTriggeredPayload): NotificationConfig {
    // 根据来源类型确定通知类型
    const notificationType = this.mapSourceTypeToNotificationType(payload.sourceType);

    // 根据来源类型确定音效
    const soundConfig = this.createSoundConfigForSource(payload.sourceType);

    // 创建通知ID
    const notificationId = `reminder-${payload.reminderId}-${Date.now()}`;

    const config: NotificationConfig = {
      id: notificationId,
      title: payload.title,
      message: payload.message,
      type: notificationType,
      priority: payload.priority || NotificationPriority.NORMAL,
      methods: payload.methods || [NotificationMethod.DESKTOP, NotificationMethod.SOUND],
      timestamp: payload.actualTime,
      sourceModule: 'schedule',
      sourceId: payload.sourceId,
      sound: soundConfig,
      data: {
        reminderId: payload.reminderId,
        sourceType: payload.sourceType,
        scheduledTime: payload.scheduledTime,
        actualTime: payload.actualTime,
        metadata: payload.metadata,
      },
      actions: this.createActionsForReminder(payload),
      desktop: {
        icon: this.getIconForSourceType(payload.sourceType),
        requireInteraction: payload.priority === NotificationPriority.URGENT,
        tag: `reminder-${payload.sourceType}-${payload.sourceId}`,
      },
    };

    return config;
  }

  /**
   * 将源类型映射到通知类型
   */
  private mapSourceTypeToNotificationType(sourceType: string): NotificationType {
    const typeMap: Record<string, NotificationType> = {
      task: NotificationType.TASK,
      goal: NotificationType.GOAL,
      reminder: NotificationType.REMINDER,
      custom: NotificationType.SYSTEM,
    };

    return typeMap[sourceType] || NotificationType.REMINDER;
  }

  /**
   * 为来源类型创建音效配置
   */
  private createSoundConfigForSource(sourceType: string): SoundConfig {
    const soundMap: Record<string, SoundType> = {
      task: SoundType.REMINDER,
      goal: SoundType.ALERT,
      reminder: SoundType.NOTIFICATION,
      custom: SoundType.DEFAULT,
    };

    return {
      enabled: true,
      type: soundMap[sourceType] || SoundType.DEFAULT,
      volume: 0.7,
    };
  }

  /**
   * 为提醒创建操作按钮
   */
  private createActionsForReminder(payload: ReminderTriggeredPayload) {
    const actions = [
      {
        id: 'mark-done',
        label: '标记完成',
        action: 'mark-done',
        icon: '/icons/check.png',
        primary: true,
        handler: async (config: NotificationConfig) => {
          console.log('[NotificationEventHandlers] 标记提醒完成:', config.data?.reminderId);

          // 发布完成事件
          eventBus.emit('reminder:marked-done', {
            reminderId: config.data?.reminderId,
            sourceType: config.data?.sourceType,
            sourceId: config.data?.sourceId,
            completedAt: new Date(),
          });
        },
      },
    ];

    // 根据源类型添加特定操作
    if (payload.sourceType === 'task') {
      actions.push({
        id: 'view-task',
        label: '查看任务',
        action: 'view-task',
        icon: '/icons/task.png',
        primary: false,
        handler: async (config: NotificationConfig) => {
          console.log('[NotificationEventHandlers] 查看任务:', config.data?.sourceId);
          // 导航到任务详情页
          // router.push(`/tasks/${config.data?.sourceId}`);
        },
      });
    } else if (payload.sourceType === 'goal') {
      actions.push({
        id: 'view-goal',
        label: '查看目标',
        action: 'view-goal',
        icon: '/icons/goal.png',
        primary: false,
        handler: async (config: NotificationConfig) => {
          console.log('[NotificationEventHandlers] 查看目标:', config.data?.sourceId);
          // 导航到目标详情页
          // router.push(`/goals/${config.data?.sourceId}`);
        },
      });
    }

    return actions;
  }

  /**
   * 获取源类型对应的图标
   */
  private getIconForSourceType(sourceType: string): string {
    const iconMap: Record<string, string> = {
      task: '/icons/task-notification.png',
      goal: '/icons/goal-notification.png',
      reminder: '/icons/reminder-notification.png',
      custom: '/icons/custom-notification.png',
    };

    return iconMap[sourceType] || '/icons/default-notification.png';
  }

  /**
   * 标准化提醒载荷
   * 兼容不同来源的数据格式
   */
  private normalizeReminderPayload(payload: any): ReminderTriggeredPayload {
    // 如果已经是标准格式
    if (payload.reminderId && payload.sourceType) {
      return payload as ReminderTriggeredPayload;
    }

    // 兼容旧格式：调度器载荷
    return this.convertSchedulerPayloadToStandard(payload);
  }

  /**
   * 转换调度器载荷为标准格式（向后兼容）
   */
  private convertSchedulerPayloadToStandard(payload: any): ReminderTriggeredPayload {
    logger.debug('转换调度器载荷为标准格式', {
      hasId: !!payload.id,
      hasType: !!payload.type,
      hasTitle: !!payload.title,
      hasAlertMethods: !!payload.alertMethods,
    });

    // 调度器发送的载荷格式
    return {
      reminderId: payload.id || `scheduler-${Date.now()}`,
      sourceType: payload.type || 'schedule',
      sourceId: payload.id,
      title: payload.title || '计划提醒',
      message: payload.message || '您有一个计划提醒',
      priority: this.mapSchedulerPriorityToNotificationPriority(payload.priority),
      methods: this.mapSchedulerAlertMethodsToNotificationMethods(payload.alertMethods),
      scheduledTime: new Date(), // 调度器发送时就是计划时间
      actualTime: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      metadata: {
        taskType: payload.type,
        soundVolume: payload.soundVolume,
        popupDuration: payload.popupDuration,
        allowSnooze: payload.allowSnooze,
        snoozeOptions: payload.snoozeOptions,
        customActions: payload.customActions,
        originalPayload: payload,
      },
    };
  }

  /**
   * 转换调度器优先级到通知优先级
   */
  private mapSchedulerPriorityToNotificationPriority(
    schedulerPriority: string,
  ): NotificationPriority {
    const priorityMap: Record<string, NotificationPriority> = {
      LOW: NotificationPriority.LOW,
      NORMAL: NotificationPriority.NORMAL,
      HIGH: NotificationPriority.HIGH,
      URGENT: NotificationPriority.URGENT,
    };

    return priorityMap[schedulerPriority?.toUpperCase()] || NotificationPriority.NORMAL;
  }

  /**
   * 转换调度器提醒方式到通知方式
   */
  private mapSchedulerAlertMethodsToNotificationMethods(
    alertMethods: string[],
  ): NotificationMethod[] {
    if (!Array.isArray(alertMethods)) {
      return [NotificationMethod.DESKTOP, NotificationMethod.SOUND];
    }

    const methods: NotificationMethod[] = [];

    if (alertMethods.includes('POPUP')) {
      methods.push(NotificationMethod.DESKTOP);
    }
    if (alertMethods.includes('SOUND') || alertMethods.includes('AUDIO')) {
      methods.push(NotificationMethod.SOUND);
    }
    if (alertMethods.includes('VIBRATE')) {
      methods.push(NotificationMethod.VIBRATION);
    }

    // 如果没有匹配的方法，默认使用桌面通知
    return methods.length > 0 ? methods : [NotificationMethod.DESKTOP];
  }

  /**
   * 销毁事件监听器
   */
  destroy(): void {
    if (!this.isInitialized) return;

    logger.info('销毁事件监听器');

    // 移除统一提醒事件监听
    eventBus.off('reminder-triggered');

    // 移除Notification内部事件监听
    Object.values(NOTIFICATION_EVENTS).forEach((event) => {
      eventBus.off(event);
    });

    // 移除系统事件监听
    eventBus.off('auth:user-logged-out');

    this.isInitialized = false;
    logger.info('事件监听器已销毁');
  }
}
