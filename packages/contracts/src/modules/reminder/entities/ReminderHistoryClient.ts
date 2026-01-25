/**
 * Reminder History Entity - Client Interface
 * 提醒历史实体 - 客户端接口
 */

import type { TriggerResult, NotificationChannel } from '../enums';
import type { ReminderHistoryServerDTO } from './ReminderHistoryServer';

// ============ DTO 定义 ============

/**
 * Reminder History Client DTO
 */
export interface ReminderHistoryClientDTO {
  uuid: string;
  templateUuid: string;
  triggeredAt: number;
  result: TriggerResult;
  error?: string | null;
  notificationSent: boolean;
  notificationChannels?: NotificationChannel[] | null;
  createdAt: number;

  // UI 扩展
  resultText: string; // "成功" | "失败" | "跳过"
  timeAgo: string; // "3 小时前"
  channelsText?: string | null; // "应用内 + 推送"
}

// ============ 实体接口 ============

/**
 * Reminder History 实体 - Client 接口
 */
export interface ReminderHistoryClient {
  // 基础属性
  uuid: string;
  templateUuid: string;
  triggeredAt: number;
  result: TriggerResult;
  error?: string | null;
  notificationSent: boolean;
  notificationChannels?: NotificationChannel[] | null;
  createdAt: Date;

  // UI 扩展
  resultText: string;
  timeAgo: string;
  channelsText?: string | null;

  // ===== UI 业务方法 =====

  /**
   * 获取结果徽章
   */
  getResultBadge(): { text: string; color: string; icon: string };

  /**
   * 获取显示文本
   */
  getDisplayText(): string;

  /**
   * 是否成功
   */
  isSuccess(): boolean;

  /**
   * 是否失败
   */
  isFailed(): boolean;

  /**
   * 是否跳过
   */
  isSkipped(): boolean;

  // ===== 转换方法 =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): ReminderHistoryServerDTO;
}

/**
 * Reminder History Client 静态工厂方法接口
 */
export interface ReminderHistoryClientStatic {
  /**
   * 从 Server DTO 创建客户端实体
   */
  fromServerDTO(dto: ReminderHistoryServerDTO): ReminderHistoryClient;
}
