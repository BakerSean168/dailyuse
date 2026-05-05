/**
 * Reminder History Entity - Server Interface
 * 提醒历史实体 - 服务端接口
 */

import type { TriggerResult, NotificationChannel } from '../value-objects';

// ============ DTO 定义 ============

/**
 * Reminder History Server DTO
 */
export interface ReminderHistoryServerDTO {
  id: string;
  templateId: string;
  identityId: string;
  triggeredAt: number; // epoch ms
  result: TriggerResult;
  error?: string | null;
  notificationSent: boolean;
  notificationChannels?: NotificationChannel[] | null;
  createdAt: number; // epoch ms
}
