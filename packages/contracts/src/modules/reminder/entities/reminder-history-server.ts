/**
 * Reminder History Entity - Server Interface
 * 提醒历史实体 - 服务端接口
 */

import type { TriggerResult, NotificationChannel } from '../value-objects';
import type { ReminderHistoryClientDTO } from './reminder-history-client';

// ============ DTO 定义 ============

/**
 * Reminder History Server DTO
 */
export interface ReminderHistoryServerDTO {
  id: string;
  templateId: string;
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
  id: string;
  templateId: string;
  triggeredAt: number;
  result: TriggerResult;
  error?: string | null;
  notificationSent: boolean;
  notificationChannels?: string | null; // JSON string
  createdAt: Date;
}
