/**
 * Reminder History Entity - Server Interface
 * 提醒历史实体 - 服务端接口
 */

import type { TriggerResult, NotificationChannel } from '../enums';
import type { ReminderHistoryClientDTO } from './ReminderHistoryClient';

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

  // ===== 业务方法 =====

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

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): ReminderHistoryServerDTO;

  toClientDTO(): ReminderHistoryClientDTO;
  /**
   * 转换为 Persistence DTO (数据库)
   */
  toPersistenceDTO(): ReminderHistoryPersistenceDTO;
}

/**
 * Reminder History 静态工厂方法接口
 */
export interface ReminderHistoryServerStatic {
  /**
   * 创建新的 Reminder History 实体（静态工厂方法）
   */
  create(params: {
    templateUuid: string;
    triggeredAt: number;
    result: TriggerResult;
    error?: string;
    notificationSent: boolean;
    notificationChannels?: NotificationChannel[];
  }): ReminderHistoryServer;

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: ReminderHistoryServerDTO): ReminderHistoryServer;

  /**
   * 从 Persistence DTO 创建实体
   */
  fromPersistenceDTO(dto: ReminderHistoryPersistenceDTO): ReminderHistoryServer;
}
