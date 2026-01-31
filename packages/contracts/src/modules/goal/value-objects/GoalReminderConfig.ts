/**
 * Goal Reminder Config Value Object
 * 目标提醒配置值对象
 */

import type { ReminderTriggerType } from '../enums';

// ============ 辅助类型 ============

/**
 * 单个提醒触发器配置
 */
export interface ReminderTrigger {
  type: ReminderTriggerType;
  value: number; // 百分比（50 表示 50%）或天数（100 表示 100 天）
  enabled: boolean; // 是否启用
}

// ============ 接口定义 ============

/**
 * 目标提醒配置 - Server 接口
 */
export interface IGoalReminderConfigServer {
  enabled: boolean; // 总开关
  triggers: ReminderTrigger[]; // 触发器列表

  // 值对象方法
  equals(other: IGoalReminderConfigServer): boolean;
  with(
    updates: Partial<
      Omit<
        IGoalReminderConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IGoalReminderConfigServer;

  // 业务方法
  addTrigger(trigger: ReminderTrigger): IGoalReminderConfigServer;
  removeTrigger(type: ReminderTriggerType, value: number): IGoalReminderConfigServer;
  updateTrigger(
    type: ReminderTriggerType,
    value: number,
    updates: Partial<ReminderTrigger>,
  ): IGoalReminderConfigServer;
  getTriggersByType(type: ReminderTriggerType): ReminderTrigger[];
  hasActiveTriggers(): boolean; // 是否有启用的触发器
  getActiveTriggers(): ReminderTrigger[]; // 获取所有启用的触发器
  enable(): IGoalReminderConfigServer; // 启用提醒
  disable(): IGoalReminderConfigServer; // 禁用提醒

  // DTO 转换方法}

/**
 * 目标提醒配置 - Client 接口
 */
export interface IGoalReminderConfigClient {
  enabled: boolean;
  triggers: ReminderTrigger[];

  // 值对象方法
  equals(other: IGoalReminderConfigClient): boolean;

  // DTO 转换方法}

// ============ DTO 定义 ============

/**
 * Goal Reminder Config Server DTO
 */
export interface GoalReminderConfigServerDTO {
  enabled: boolean;
  triggers: ReminderTrigger[];
}

/**
 * Goal Reminder Config Client DTO
 */
export interface GoalReminderConfigClientDTO {
  enabled: boolean;
  triggers: ReminderTrigger[];
}

/**
 * Goal Reminder Config Persistence DTO
 */
export interface GoalReminderConfigPersistenceDTO {
  enabled: boolean;
  triggers: string; // JSON.stringify(ReminderTrigger[])
}

// ============ 类型导出 ============

export type GoalReminderConfigServer = IGoalReminderConfigServer;
export type GoalReminderConfigClient = IGoalReminderConfigClient;
