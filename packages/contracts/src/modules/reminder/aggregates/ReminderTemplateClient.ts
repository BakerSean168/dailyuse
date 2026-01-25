/**
 * Reminder Template Aggregate Root - Client Interface
 * 提醒模板聚合根 - 客户端接口
 */

import { ImportanceLevel } from '../../../shared/importance';
import type { ReminderType, ReminderStatus } from '../enums';
import type { ReminderTemplateServerDTO } from './ReminderTemplateServer';

// 从值对象导入类型（接口 + DTO）
import type {
  RecurrenceConfigServerDTO,
  RecurrenceConfigClientDTO,
  RecurrenceConfigClient,
  NotificationConfigServerDTO,
  NotificationConfigClientDTO,
  NotificationConfigClient,
  TriggerConfigServerDTO,
  TriggerConfigClientDTO,
  TriggerConfigClient,
  ActiveTimeConfigServerDTO,
  ActiveTimeConfigClientDTO,
  ActiveTimeConfigClient,
  ActiveHoursConfigServerDTO,
  ActiveHoursConfigClientDTO,
  ActiveHoursConfigClient,
  ReminderStatsServerDTO,
  ReminderStatsClientDTO,
  ReminderStatsClient,
} from '../value-objects';
import type { ReminderHistoryClientDTO, ReminderHistoryClient } from '../entities/ReminderHistoryClient';

// ============ DTO 定义 ============

/**
 * Reminder Template Client DTO
 */
export interface ReminderTemplateClientDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  type: ReminderType;
  trigger: TriggerConfigClientDTO;
  recurrence?: RecurrenceConfigClientDTO | null;
  activeTime: ActiveTimeConfigClientDTO;
  activeHours?: ActiveHoursConfigClientDTO | null;
  notificationConfig: NotificationConfigClientDTO;
  selfEnabled: boolean;
  status: ReminderStatus;
  effectiveEnabled: boolean; // 实际启用状态（计算得出）
  groupUuid?: string | null;
  importanceLevel: ImportanceLevel;
  tags: string[];
  color?: string | null;
  icon?: string | null;
  nextTriggerAt?: number | null;
  stats: ReminderStatsClientDTO;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== 子实体 DTO =====
  history?: ReminderHistoryClientDTO[] | null; // 提醒历史列表（可选加载）

  // UI 扩展
  displayTitle: string;
  typeText: string; // "一次性" | "循环"
  triggerText: string; // "每天 09:00" | "每隔 30 分钟"
  recurrenceText?: string | null; // "每周一、三、五" | "每天"
  statusText: string;
  importanceText: string;
  nextTriggerText?: string | null; // "明天 09:00" | "10 分钟后"
  isActive: boolean;
  isPaused: boolean;
  lastTriggeredText?: string | null; // "3 小时前"
  controlledByGroup: boolean; // 是否受组控制
}

// ============ 实体接口 ============

/**
 * Reminder Template 聚合根 - Client 接口
 */
export interface ReminderTemplateClient {
  // 基础属性
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  type: ReminderType;
  trigger: TriggerConfigClient;
  recurrence?: RecurrenceConfigClient | null;
  activeTime: ActiveTimeConfigClient;
  activeHours?: ActiveHoursConfigClient | null;
  notificationConfig: NotificationConfigClient;
  selfEnabled: boolean;
  status: ReminderStatus;
  effectiveEnabled: boolean;
  groupUuid?: string | null;
  importanceLevel: ImportanceLevel;
  tags: string[];
  color?: string | null;
  icon?: string | null;
  nextTriggerAt?: number | null;
  stats: ReminderStatsClient;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // UI 扩展
  displayTitle: string;
  typeText: string;
  triggerText: string;
  recurrenceText?: string | null;
  statusText: string;
  importanceText: string;
  nextTriggerText?: string | null;
  isActive: boolean;
  isPaused: boolean;
  lastTriggeredText?: string | null;
  controlledByGroup: boolean;

  // ===== UI 业务方法 =====

  // 格式化展示
  getStatusBadge(): { text: string; color: string; icon: string };
  getImportanceBadge(): { text: string; color: string };
  getTriggerDisplay(): string;
  getNextTriggerDisplay(): string;

  // 操作判断
  canEnable(): boolean;
  canPause(): boolean;
  canEdit(): boolean;
  canDelete(): boolean;

  // ===== 转换方法 =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): ReminderTemplateServerDTO;
}

/**
 * Reminder Template Client 静态工厂方法接口
 */
export interface ReminderTemplateClientStatic {
  /**
   * 从 Server DTO 创建客户端实体
   */
  fromServerDTO(dto: ReminderTemplateServerDTO): ReminderTemplateClient;
}
