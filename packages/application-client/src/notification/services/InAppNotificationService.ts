/**
 * 应用内通知服务
 * 当系统通知不可用时的备用方案
 */
import { eventBus } from '@dailyuse/utils';

interface InAppNotificationData {
  id: string;
  title: string;
  message: string;
  type: 'GENERAL_REMINDER' | 'TASK_REMINDER' | 'GOAL_REMINDER';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  duration?: number;
  onClick?: () => void;
}

export class InAppNotificationService {
  private static instance: InAppNotificationService;

  private constructor() {}

  static getInstance(): InAppNotificationService {
    if (!InAppNotificationService.instance) {
      InAppNotificationService.instance = new InAppNotificationService();
    }
    return InAppNotificationService.instance;
  }

  /**
   * 显示应用内通知
   */
  show(data: InAppNotificationData): void {
    console.log('[InAppNotificationService] 显示应用内通知:', data);
    eventBus.emit('notification:in-app', data);
  }

  /**
   * 从通知配置创建应用内通知
   */
  showFromConfig(config: {
    id: string;
    title: string;
    message: string;
    type?: string;
    priority?: string;
    duration?: number;
    onClick?: () => void;
  }): void {
    const data: InAppNotificationData = {
      id: config.id,
      title: config.title,
      message: config.message,
      type: this.mapType(config.type),
      priority: this.mapPriority(config.priority),
      duration: config.duration,
      onClick: config.onClick,
    };

    this.show(data);
  }

  private mapType(type?: string): 'GENERAL_REMINDER' | 'TASK_REMINDER' | 'GOAL_REMINDER' {
    switch (type) {
      case 'TASK_REMINDER':
      case 'task':
        return 'TASK_REMINDER';
      case 'GOAL_REMINDER':
      case 'goal':
        return 'GOAL_REMINDER';
      default:
        return 'GENERAL_REMINDER';
    }
  }

  private mapPriority(priority?: string): 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' {
    switch (priority?.toUpperCase()) {
      case 'LOW':
        return 'LOW';
      case 'HIGH':
        return 'HIGH';
      case 'URGENT':
        return 'URGENT';
      default:
        return 'NORMAL';
    }
  }
}
