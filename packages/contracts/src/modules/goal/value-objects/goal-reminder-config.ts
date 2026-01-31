/**
 * Goal Reminder Config Value Object Contracts
 * 目标提醒配置值对象契约
 *
 * 注意：Contracts 包只包含纯类型定义，不包含业务逻辑或方法
 */

import type { ReminderTriggerType } from './reminder-trigger-type';

// ============ 辅助类型 ============

/**
 * 单个提醒触发器配置
 */
export interface ReminderTrigger {
  type: ReminderTriggerType;
  value: number; // 百分比（50 表示 50%）或天数（100 表示 100 天）
  enabled: boolean; // 是否启用
}

// ============ Domain Shape (领域层) ============

/**
 * 目标提醒配置 - Domain Shape
 * 给 domain-shared 中的 Class 实现用
 */
export interface GoalReminderConfig {
  enabled: boolean; // 总开关
  triggers: ReminderTrigger[]; // 触发器列表
}

// ============ Transfer DTO (传输层) ============

/**
 * Goal Reminder Config DTO
 * API 传输用
 */
export interface GoalReminderConfigDTO {
  enabled: boolean;
  triggers: ReminderTrigger[];
}

// ============ Persistence DTO (持久化层) ============

/**
 * Goal Reminder Config Persistence DTO
 * 数据库存储用
 */
export interface GoalReminderConfigPersistenceDTO {
  enabled: boolean;
  triggers: string; // JSON.stringify(ReminderTrigger[])
}
