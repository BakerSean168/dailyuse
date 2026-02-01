/**
 * Reminder Template Aggregate Root - Server Interface
 * 提醒模板聚合根 - 服务端接口
 */

import { ImportanceLevel } from '../../../shared/importance';
import type {
  ReminderHistoryServer,
  ReminderHistoryServerDTO,
} from '../entities/reminder-history-server';

// 从值对象导入类型
import type {
  ReminderType,
  ReminderStatus,
  RecurrenceConfigServer,
  RecurrenceConfigServerDTO,
  NotificationConfigServer,
  NotificationConfigServerDTO,
  TriggerConfigServer,
  TriggerConfigServerDTO,
  ActiveTimeConfigServer,
  ActiveTimeConfigServerDTO,
  ActiveHoursConfigServer,
  ActiveHoursConfigServerDTO,
  ReminderStatsServer,
  ReminderStatsServerDTO,
  ResponseMetricsServer,
  ResponseMetricsServerDTO,
  FrequencyAdjustmentServer,
  FrequencyAdjustmentServerDTO,
} from '../value-objects';
import type { ReminderTemplateClientDTO } from './reminder-template-client';

// ============ DTO 定义 ============

/**
 * Reminder Template Server DTO
 */
export interface ReminderTemplateServerDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  type: ReminderType;
  trigger: TriggerConfigServerDTO;
  recurrence?: RecurrenceConfigServerDTO | null;
  activeTime: ActiveTimeConfigServerDTO;
  activeHours?: ActiveHoursConfigServerDTO | null;
  notificationConfig: NotificationConfigServerDTO;
  selfEnabled: boolean;
  status: ReminderStatus;
  groupUuid?: string | null;
  importanceLevel: ImportanceLevel;
  tags: string[];
  color?: string | null;
  icon?: string | null;
  nextTriggerAt?: number | null; // epoch ms
  stats: ReminderStatsServerDTO;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  deletedAt?: number | null; // epoch ms

  // ===== 智能频率相关字段 (Story 5-2) =====
  responseMetrics?: ResponseMetricsServerDTO | null; // 响应指标
  frequencyAdjustment?: FrequencyAdjustmentServerDTO | null; // 频率调整
  smartFrequencyEnabled: boolean; // 是否启用智能频率

  // ===== 子实体 DTO =====
  history?: ReminderHistoryServerDTO[] | null; // 提醒历史列表（可选加载）
}

/**
 * Reminder Template Persistence DTO (数据库映射)
 */
export interface ReminderTemplatePersistenceDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  type: ReminderType;
  trigger: string; // JSON string
  recurrence?: string | null; // JSON string
  activeTime: string; // JSON string
  activeHours?: string | null; // JSON string
  notificationConfig: string; // JSON string
  selfEnabled: boolean;
  status: ReminderStatus;
  groupUuid?: string | null;
  importanceLevel: ImportanceLevel;
  tags: string; // JSON string
  color?: string | null;
  icon?: string | null;
  nextTriggerAt?: Date | null;
  stats: string; // JSON string
  
  // Smart Frequency: Response Metrics（扁平化字段）
  clickRate?: number | null;
  ignoreRate?: number | null;
  avgResponseTime?: number | null;
  snoozeCount?: number;
  effectivenessScore?: number | null;
  sampleSize?: number;
  lastAnalysisTime?: Date | null;
  
  // Smart Frequency: Frequency Adjustment（扁平化字段）
  originalInterval?: number | null;
  adjustedInterval?: number | null;
  adjustmentReason?: string | null;
  adjustmentTime?: Date | null;
  isAutoAdjusted?: boolean;
  userConfirmed?: boolean;
  
  smartFrequencyEnabled?: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// ============ 领域事件 ============

/**
 * 提醒模板创建事件
 */
export interface ReminderTemplateCreatedEvent {
  type: 'reminder.template.created';
  aggregateId: string;
  timestamp: Date;
  payload: {
    template: ReminderTemplateServerDTO;
  };
}

/**
 * 提醒模板更新事件
 */
export interface ReminderTemplateUpdatedEvent {
  type: 'reminder.template.updated';
  aggregateId: string;
  timestamp: Date;
  payload: {
    template: ReminderTemplateServerDTO;
    previousData: Partial<ReminderTemplateServerDTO>;
    changes: string[];
  };
}

/**
 * 提醒模板删除事件
 */
export interface ReminderTemplateDeletedEvent {
  type: 'reminder.template.deleted';
  aggregateId: string;
  timestamp: Date;
  payload: {
    templateUuid: string;
    templateTitle: string;
  };
}

/**
 * 提醒模板启用事件
 */
export interface ReminderTemplateEnabledEvent {
  type: 'reminder.template.enabled';
  aggregateId: string;
  timestamp: Date;
  payload: {
    templateUuid: string;
  };
}

/**
 * 提醒模板暂停事件
 */
export interface ReminderTemplatePausedEvent {
  type: 'reminder.template.paused';
  aggregateId: string;
  timestamp: Date;
  payload: {
    templateUuid: string;
  };
}

/**
 * 提醒模板触发事件
 */
export interface ReminderTemplateTriggeredEvent {
  type: 'reminder.template.triggered';
  aggregateId: string;
  timestamp: Date;
  payload: {
    templateUuid: string;
    triggeredAt: number;
    nextTriggerAt?: number | null;
  };
}

/**
 * 提醒模板移动到分组事件
 */
export interface ReminderTemplateMovedEvent {
  type: 'reminder.template.moved';
  aggregateId: string;
  timestamp: Date;
  payload: {
    templateUuid: string;
    oldGroupUuid?: string | null;
    newGroupUuid?: string | null;
  };
}

/**
 * Reminder Template 领域事件联合类型
 */
export type ReminderTemplateDomainEvent =
  | ReminderTemplateCreatedEvent
  | ReminderTemplateUpdatedEvent
  | ReminderTemplateDeletedEvent
  | ReminderTemplateEnabledEvent
  | ReminderTemplatePausedEvent
  | ReminderTemplateTriggeredEvent
  | ReminderTemplateMovedEvent;

// ============ 实体接口 ============

/**
 * Reminder Template 聚合根 - Server 接口（实例方法）
 */
export interface ReminderTemplateServer {
  // 基础属性
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;
  type: ReminderType;
  trigger: TriggerConfigServer;
  recurrence?: RecurrenceConfigServer | null;
  activeTime: ActiveTimeConfigServer;
  activeHours?: ActiveHoursConfigServer | null;
  notificationConfig: NotificationConfigServer;
  selfEnabled: boolean;
  status: ReminderStatus;
  groupUuid?: string | null;
  importanceLevel: ImportanceLevel;
  tags: string[];
  color?: string | null;
  icon?: string | null;
  nextTriggerAt?: number | null;
  stats: ReminderStatsServer;

  // 时间戳 (统一使用 number epoch ms)
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // ===== 智能频率相关属性 (Story 5-2) =====
  responseMetrics?: ResponseMetricsServer | null;
  frequencyAdjustment?: FrequencyAdjustmentServer | null;
  smartFrequencyEnabled: boolean;

  // ===== 子实体集合（聚合根统一管理） =====

  /**
   * 提醒历史列表（懒加载，可选）
   */
  history?: ReminderHistoryServer[] | null;

  // ===== 工厂方法（创建子实体 - 实例方法） =====

  /**
   * 创建子实体：ReminderHistory（通过聚合根创建）
   */
  createHistory(params: {
    triggeredAt: number;
    result: 'SUCCESS' | 'FAILED' | 'SKIPPED';
    error?: string;
  }): ReminderHistoryServer;

  // ===== 子实体管理方法 =====

  /**
   * 添加历史记录到聚合根
   */

  /**
   * 获取所有历史记录
   */

  /**
   * 获取最近 N 条历史记录
   */

  // ===== 业务方法 =====

  // 状态管理

  // 实际启用状态计算

  // 触发计算

  // 触发记录

  // 查询

  // 软删除

  // 标签管理

  // ===== 智能频率相关方法 (Story 5-2) =====

  /**
   * 更新响应指标
   */

  /**
   * 应用频率调整（自动调整或用户手动调整）
   */

  /**
   * 用户确认频率调整
   */

  /**
   * 用户拒绝频率调整
   */

  /**
   * 启用/禁用智能频率
   */

  /**
   * 判断是否需要频率调整（基于响应指标）
   */

  /**
   * 计算建议的频率调整
   */

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO（递归转换子实体）
   * @param includeChildren 是否包含子实体（默认 false）
   */

  /**
   * 转换为 Client DTO
   * @param includeChildren 是否包含子实体（默认 false）
   */

  /**
   * 转换为 Persistence DTO (数据库)
   */
}
