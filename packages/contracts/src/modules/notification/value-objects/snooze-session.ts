import type { NotificationId } from '../../../primitives/ids';

export interface SnoozeSessionDTO {
  notificationId: NotificationId; // 关联的原始通知
  
  // 延迟配置
  snoozedAt: number;      // 用户点击“稍后”的时间戳
  snoozeUntil: number;    // 计划再次弹出的时间戳
  
  // 计数器
  snoozeCount: number;    // 已经“稍后”过几次了？(用于防止无限套娃)
  
  // 延迟步长 (分钟)
  interval: number;       // 5, 10, 30...
}