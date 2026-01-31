/**
 * Reminder History Entity - Client Interface
 * 提醒历史实体 - 客户端接�?
 */

import type {
  ReminderInstanceId,
  ReminderTemplateId,
  TransferDate,
  DomainDate,
} from '@/primitives';
import type { TriggerResult } from '../value-objects/trigger-result';
import type { NotificationChannel } from '../value-objects/notification-channel';
import type { ReminderHistoryServerDTO } from './reminder-history-server';

// ============ DTO 定义 ============

/**
 * Reminder History Client DTO
 */
export interface ReminderHistoryClientDTO {
  id: string;
  templateId: string;
  triggeredAt: TransferDate;
  result: TriggerResult;
  error: string | null;
  notificationSent: boolean;
  notificationChannels: NotificationChannel[] | null;
  createdAt: TransferDate;

  // UI 扩展
  resultText: string; // "成功" | "失败" | "跳过"
  timeAgo: string; // "3 小时�?
  channelsText: string | null; // "应用�?+ 推�?
}

// ============ 实体接口 ============

/**
 * Reminder History 实体 - Client 接口
 */
export interface ReminderHistoryClient {
  // 基础属�?
  id: ReminderInstanceId;
  templateId: ReminderTemplateId;
  triggeredAt: DomainDate;
  result: TriggerResult;
  error: string | null;
  notificationSent: boolean;
  notificationChannels: NotificationChannel[] | null;
  createdAt: DomainDate;

  // UI 扩展
  resultText: string;
  timeAgo: string;
  channelsText: string | null;

  // ===== UI 业务方法 =====

  /**
   * 获取结果徽章
   */

  /**
   * 获取显示文本
   */

  /**
   * 是否成功
   */

  /**
   * 是否失败
   */

  /**
   * 是否跳过
   */

}

/**
 * Reminder History Client 静态工厂方法接�?
 */
