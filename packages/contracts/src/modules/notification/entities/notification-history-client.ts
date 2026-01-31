/**
 * NotificationHistory Entity - Client Interface
 * 通知历史实体 - 客户端接口
 */

import type { NotificationHistoryServerDTO } from './notification-history-server';

// ============ DTO 定义 ============

/**
 * NotificationHistory Client DTO
 */
export interface NotificationHistoryClientDTO {
  uuid: string;
  notificationUuid: string;
  action: string;
  details?: any | null;
  createdAt: number;

  // UI 扩展属性
  actionText: string;
  timeAgo: string;
  formattedCreatedAt: string;
}

// ============ 实体接口 ============

/**
 * NotificationHistory 实体 - Client 接口（实例方法）
 */
export interface NotificationHistoryClient {
  // 基础属性
  uuid: string;
  notificationUuid: string;
  action: string;
  details?: any | null;

  // 时间戳
  createdAt: Date;

  // UI 扩展属性
  actionText: string;
  timeAgo: string;
  formattedCreatedAt: string;

  // ===== UI 业务方法 =====

  // 格式化展示

}
