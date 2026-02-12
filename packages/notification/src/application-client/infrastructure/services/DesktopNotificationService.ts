/**
 * 桌面通知服务
 * @description 管理系统级桌面通知（右下角弹窗）
 */

import { NotificationPermission } from '../../application/types';

import type {
  NotificationConfig,
  DesktopNotificationConfig,
  NotificationAction,
} from '../../application/types';

/**
 * 扩展的通知选项接口（包含浏览器可能支持的特性）
 */
interface ExtendedNotificationOptions extends NotificationOptions {
  image?: string;
  vibrate?: number[];
  renotify?: boolean;
  timestamp?: number;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

import {
  publishNotificationShown,
  publishNotificationClicked,
  publishNotificationClosed,
  publishNotificationFailed,
  publishPermissionChanged,
} from '../../application/events/notificationEvents';

/**
 * 桌面通知管理器
 */
export class DesktopNotificationService {
  private activeNotifications = new Map<string, Notification>();
  private permission: NotificationPermission = NotificationPermission.DEFAULT;

  constructor() {
    this.initializePermission();
  }

  /**
   * 初始化权限状态
   */
  private initializePermission(): void {
    if ('Notification' in window) {
      this.permission = Notification.permission as NotificationPermission;
    } else {
      console.warn('[DesktopNotification] 浏览器不支持桌面通知');
      this.permission = NotificationPermission.DENIED;
    }
  }

  /**
   * 请求通知权限
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('[DesktopNotification] 浏览器不支持桌面通知');
      return NotificationPermission.DENIED;
    }

    const oldPermission = this.permission;

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission as NotificationPermission;

      if (oldPermission !== this.permission) {
        publishPermissionChanged(oldPermission, this.permission);
      }

      console.log('[DesktopNotification] 权限状态:', this.permission);
      return this.permission;
    } catch (error) {
      console.error('[DesktopNotification] 请求权限失败:', error);
      return NotificationPermission.DENIED;
    }
  }

  /**
   * 获取当前权限状态
   */
  getPermission(): NotificationPermission {
    return this.permission;
  }

  /**
   * 检查是否可以显示通知
   */
  canShowNotification(): boolean {
    return 'Notification' in window && this.permission === NotificationPermission.GRANTED;
  }

  /**
   * 显示桌面通知
   */
  async show(config: NotificationConfig): Promise<string> {
    // 检查权限
    if (!this.canShowNotification()) {
      if (this.permission === NotificationPermission.DEFAULT) {
        // 尝试请求权限
        await this.requestPermission();
        if (!this.canShowNotification()) {
          throw new Error('桌面通知权限被拒绝');
        }
      } else {
        throw new Error('桌面通知权限不可用');
      }
    }

    try {
      // 构建通知选项
      const options = this.buildNotificationOptions(config);

      // 创建桌面通知
      const notification = new Notification(config.title, options);

      // 保存通知引用
      this.activeNotifications.set(config.id, notification);

      // 设置事件监听器
      this.setupNotificationListeners(notification, config);

      // 发布显示事件
      publishNotificationShown(config, 'desktop', config.autoClose);

      // 自动关闭
      if (config.autoClose && config.autoClose > 0) {
        setTimeout(() => {
          this.close(config.id);
        }, config.autoClose);
      }

      console.log('[DesktopNotification] 通知已显示:', config.id);
      return config.id;
    } catch (error) {
      console.error('[DesktopNotification] 显示通知失败:', error);
      publishNotificationFailed(config, error as Error);
      throw error;
    }
  }

  /**
   * 关闭指定通知
   */
  close(notificationId: string): void {
    const notification = this.activeNotifications.get(notificationId);
    if (notification) {
      notification.close();
      this.activeNotifications.delete(notificationId);
    }
  }

  /**
   * 关闭所有通知
   */
  closeAll(): void {
    this.activeNotifications.forEach((notification, id) => {
      notification.close();
    });
    this.activeNotifications.clear();
  }

  /**
   * 获取活跃通知数量
   */
  getActiveCount(): number {
    return this.activeNotifications.size;
  }

  /**
   * 构建Notification API选项
   */
  private buildNotificationOptions(config: NotificationConfig): ExtendedNotificationOptions {
    const options: ExtendedNotificationOptions = {
      body: config.message,
      icon: this.getNotificationIcon(config),
      badge: config.desktop?.badge,
      image: config.desktop?.image,
      tag: config.desktop?.tag || config.id,
      renotify: config.desktop?.renotify || false,
      requireInteraction: config.persistent || config.desktop?.requireInteraction || false,
      silent: config.desktop?.silent || false,
      timestamp: config.timestamp?.getTime() || Date.now(),
    };

    // 振动模式（移动设备）
    if (config.desktop?.vibrate) {
      options.vibrate = config.desktop.vibrate;
    }

    // 操作按钮（部分浏览器支持）
    if (config.actions && config.actions.length > 0) {
      options.actions = config.actions.map((action) => ({
        action: action.id,
        title: action.label,
        icon: action.icon,
      }));
    }

    return options;
  }

  /**
   * 获取通知图标
   */
  private getNotificationIcon(config: NotificationConfig): string {
    if (config.desktop?.icon) {
      return config.desktop.icon;
    }

    // 根据通知类型返回默认图标
    const iconMap: Record<string, string> = {
      reminder: '/icons/reminder.png',
      task: '/icons/task.png',
      goal: '/icons/goal.png',
      system: '/icons/system.png',
      warning: '/icons/warning.png',
      error: '/icons/error.png',
      success: '/icons/success.png',
      info: '/icons/info.png',
    };

    return iconMap[config.type] || '/icons/default-notification.png';
  }

  /**
   * 设置通知事件监听器
   */
  private setupNotificationListeners(notification: Notification, config: NotificationConfig): void {
    // 点击事件
    notification.onclick = (event) => {
      console.log('[DesktopNotification] 通知被点击:', config.id);
      publishNotificationClicked(config);

      // 执行默认动作（如果有）
      const primaryAction = config.actions?.find((action) => action.primary);
      if (primaryAction?.handler) {
        primaryAction.handler(config);
      }

      // 聚焦到应用窗口
      if (window.parent) {
        window.parent.focus();
      }
      window.focus();

      // 关闭通知
      this.close(config.id);
    };

    // 关闭事件
    notification.onclose = () => {
      console.log('[DesktopNotification] 通知被关闭:', config.id);
      publishNotificationClosed(config);
      this.activeNotifications.delete(config.id);
    };

    // 错误事件
    notification.onerror = (error) => {
      console.error('[DesktopNotification] 通知错误:', error);
      publishNotificationFailed(config, new Error('桌面通知显示失败'));
      this.activeNotifications.delete(config.id);
    };

    // 显示事件（部分浏览器支持）
    notification.onshow = () => {
      console.log('[DesktopNotification] 通知已显示:', config.id);
    };

    // 操作按钮事件（Service Worker 环境）
    if ('addEventListener' in notification) {
      notification.addEventListener('notificationclick', (event: any) => {
        if (event.action) {
          // 查找对应的操作
          const action = config.actions?.find((a) => a.id === event.action);
          if (action?.handler) {
            action.handler(config);
          }
          publishNotificationClicked(config, event.action);
        }
      });
    }
  }

  /**
   * 检测浏览器通知支持情况
   */
  getSupportInfo(): {
    supported: boolean;
    features: {
      basicNotification: boolean;
      persistentNotification: boolean;
      actionButtons: boolean;
      customIcons: boolean;
      vibration: boolean;
    };
    limitations: string[];
  } {
    const limitations: string[] = [];

    if (!('Notification' in window)) {
      return {
        supported: false,
        features: {
          basicNotification: false,
          persistentNotification: false,
          actionButtons: false,
          customIcons: false,
          vibration: false,
        },
        limitations: ['浏览器不支持通知API'],
      };
    }

    const features = {
      basicNotification: true,
      persistentNotification:
        'ServiceWorkerRegistration' in window &&
        'showNotification' in ServiceWorkerRegistration.prototype,
      actionButtons: 'actions' in Notification.prototype,
      customIcons: true,
      vibration: 'vibrate' in navigator,
    };

    // 检测限制
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      limitations.push('HTTPS协议才能使用通知功能');
    }

    if (!features.persistentNotification) {
      limitations.push('不支持持久化通知');
    }

    if (!features.actionButtons) {
      limitations.push('不支持操作按钮');
    }

    if (!features.vibration) {
      limitations.push('不支持振动');
    }

    // 检测移动设备限制
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      limitations.push('移动设备可能有额外的通知限制');
    }

    return {
      supported: true,
      features,
      limitations,
    };
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.closeAll();
    console.log('[DesktopNotification] 服务已销毁');
  }
}
