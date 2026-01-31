/**
 * Reminder History Entity - Server Interface
 * 提醒历史实体 - 服务端接口
 */

import type { TriggerResult, NotificationChannel } from '../enums';
import type { ReminderHistoryClientDTO } from './reminder-history-client';

// ============ DTO 定义 ============

/**
 * Reminder History Server DTO
 */
export interface ReminderHistoryServerDTO {
  uuid: string;
  templateUuid: string;
  triggeredAt: number; // epoch ms
  result: TriggerResult;
  error?: string | null;
  notificationSent: boolean;
  notificationChannels?: NotificationChannel[] | null;
  createdAt: number; // epoch ms
}

/**
 * Reminder History Persistence DTO (数据库映射)
 */
export interface ReminderHistoryPersistenceDTO {
  uuid: string;
  templateUuid: string;
  triggeredAt: number;
  result: TriggerResult;
  error?: string | null;
  notificationSent: boolean;
  notificationChannels?: string | null; // JSON string
  createdAt: Date;
}

// ============ 实体接口 ============

/**
 * Reminder History 实体 - Server 接口
 */
export interface ReminderHistoryServer {
  // 基础属性
  uuid: string;
  templateUuid: string;
  triggeredAt: number;
  result: TriggerResult;
  error?: string | null;
  notificationSent: boolean;
  notificationChannels?: NotificationChannel[] | null;

  // 时间戳 (统一使用 number epoch ms)
  createdAt: Date;
}

