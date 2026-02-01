/**
 * Reminder Group Aggregate Root - Server Interface
 * 提醒分组聚合根 - 服务端接口
 */

import type { ControlMode, ReminderStatus, GroupStatsServer, GroupStatsServerDTO } from '../value-objects';
import type { ReminderGroupClientDTO } from './reminder-group-client';

// ============ DTO 定义 ============

/**
 * Reminder Group Server DTO
 */
export interface ReminderGroupServerDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  controlMode: ControlMode;
  enabled: boolean;
  status: ReminderStatus;
  order: number;
  stats: GroupStatsServerDTO;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  deletedAt?: number | null; // epoch ms
}

/**
 * Reminder Group Persistence DTO (数据库映射)
 */
export interface ReminderGroupPersistenceDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  controlMode: ControlMode;
  enabled: boolean;
  status: ReminderStatus;
  order: number;
  stats: string; // JSON string
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// ============ 领域事件 ============

/**
 * 提醒分组创建事件
 */
export interface ReminderGroupCreatedEvent {
  type: 'reminder.group.created';
  aggregateId: string;
  timestamp: Date;
  payload: {
    group: ReminderGroupServerDTO;
  };
}

/**
 * 提醒分组更新事件
 */
export interface ReminderGroupUpdatedEvent {
  type: 'reminder.group.updated';
  aggregateId: string;
  timestamp: Date;
  payload: {
    group: ReminderGroupServerDTO;
    previousData: Partial<ReminderGroupServerDTO>;
    changes: string[];
  };
}

/**
 * 提醒分组删除事件
 */
export interface ReminderGroupDeletedEvent {
  type: 'reminder.group.deleted';
  aggregateId: string;
  timestamp: Date;
  payload: {
    groupUuid: string;
    groupName: string;
  };
}

/**
 * 提醒分组控制模式切换事件
 */
export interface ReminderGroupControlModeSwitchedEvent {
  type: 'reminder.group.control.mode.switched';
  aggregateId: string;
  timestamp: Date;
  payload: {
    groupUuid: string;
    previousMode: ControlMode;
    newMode: ControlMode;
  };
}

/**
 * 提醒分组启用事件
 */
export interface ReminderGroupEnabledEvent {
  type: 'reminder.group.enabled';
  aggregateId: string;
  timestamp: Date;
  payload: {
    groupUuid: string;
  };
}

/**
 * 提醒分组暂停事件
 */
export interface ReminderGroupPausedEvent {
  type: 'reminder.group.paused';
  aggregateId: string;
  timestamp: Date;
  payload: {
    groupUuid: string;
  };
}

/**
 * Reminder Group 领域事件联合类型
 */
export type ReminderGroupDomainEvent =
  | ReminderGroupCreatedEvent
  | ReminderGroupUpdatedEvent
  | ReminderGroupDeletedEvent
  | ReminderGroupControlModeSwitchedEvent
  | ReminderGroupEnabledEvent
  | ReminderGroupPausedEvent;

// ============ 实体接口 ============

/**
 * Reminder Group 聚合根 - Server 接口（实例方法）
 */
export interface ReminderGroupServer {
  // 基础属性
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  controlMode: ControlMode;
  enabled: boolean;
  status: ReminderStatus;
  order: number;
  stats: GroupStatsServer;

  // 时间戳 (统一使用 number epoch ms)
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
