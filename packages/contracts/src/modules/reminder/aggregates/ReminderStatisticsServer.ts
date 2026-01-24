/**
 * Reminder Statistics Aggregate Root - Server Interface
 * 提醒统计聚合根 - 服务端接口
 */

import type { ReminderStatisticsClientDTO } from './ReminderStatisticsClient';

// ============ 子统计信息接口 ============

/**
 * 模板统计信息
 */
export interface TemplateStatsInfo {
  totalTemplates: number;
  activeTemplates: number;
  pausedTemplates: number;
  oneTimeTemplates: number;
  recurringTemplates: number;
}

/**
 * 分组统计信息
 */
export interface GroupStatsInfo {
  totalGroups: number;
  activeGroups: number;
  pausedGroups: number;
  groupControlledGroups: number;
  individualControlledGroups: number;
}

/**
 * 触发统计信息
 */
export interface TriggerStatsInfo {
  todayTriggers: number;
  weekTriggers: number;
  monthTriggers: number;
  totalTriggers: number;
  successfulTriggers: number;
  failedTriggers: number;
}

// ============ DTO 定义 ============

/**
 * Reminder Statistics Server DTO
 */
export interface ReminderStatisticsServerDTO {
  uuid: string;
  accountUuid: string;
  templateStats: TemplateStatsInfo;
  groupStats: GroupStatsInfo;
  triggerStats: TriggerStatsInfo;
  calculatedAt: number; // epoch ms
}

/**
 * Reminder Statistics Persistence DTO (数据库映射)
 */
export interface ReminderStatisticsPersistenceDTO {
  uuid: string;
  accountUuid: string;
  templateStats: string; // JSON string
  groupStats: string; // JSON string
  triggerStats: string; // JSON string
  calculatedAt: number;
}

// ============ 领域事件 ============

/**
 * 提醒统计更新事件
 */
export interface ReminderStatisticsUpdatedEvent {
  type: 'reminder.statistics.updated';
  aggregateId: string;
  timestamp: number;
  payload: {
    statistics: ReminderStatisticsServerDTO;
  };
}

/**
 * Reminder Statistics 领域事件联合类型
 */
export type ReminderStatisticsDomainEvent = ReminderStatisticsUpdatedEvent;

// ============ 实体接口 ============

/**
 * Reminder Statistics 聚合根 - Server 接口（实例方法）
 */
export interface ReminderStatisticsServer {
  // 基础属性
  uuid: string;
  accountUuid: string;
  templateStats: TemplateStatsInfo;
  groupStats: GroupStatsInfo;
  triggerStats: TriggerStatsInfo;
  calculatedAt: number;

  // ===== 业务方法 =====

  /**
   * 重新计算统计信息
   */
  calculate(): Promise<void>;

  /**
   * 获取指定时间范围内的触发次数
   */
  getTriggersInRange(startDate: number, endDate: number): Promise<number>;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): ReminderStatisticsServerDTO;

  toClientDTO(): ReminderStatisticsClientDTO;
  /**
   * 转换为 Persistence DTO (数据库)
   */
  toPersistenceDTO(): ReminderStatisticsPersistenceDTO;
}

/**
 * Reminder Statistics 静态工厂方法接口
 */
export interface ReminderStatisticsServerStatic {
  /**
   * 创建新的 Reminder Statistics 聚合根（静态工厂方法）
   */
  create(params: { accountUuid: string }): ReminderStatisticsServer;

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: ReminderStatisticsServerDTO): ReminderStatisticsServer;

  /**
   * 从 Persistence DTO 创建实体
   */
  fromPersistenceDTO(dto: ReminderStatisticsPersistenceDTO): ReminderStatisticsServer;
}
