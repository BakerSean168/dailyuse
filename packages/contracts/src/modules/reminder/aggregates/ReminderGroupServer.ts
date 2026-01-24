/**
 * Reminder Group Aggregate Root - Server Interface
 * 提醒分组聚合根 - 服务端接口
 */

import type { ControlMode, ReminderStatus } from '../enums';
import type { GroupStatsServer, GroupStatsServerDTO } from '../value-objects';
import type { ReminderGroupClientDTO } from './ReminderGroupClient';

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
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

// ============ 领域事件 ============

/**
 * 提醒分组创建事件
 */
export interface ReminderGroupCreatedEvent {
  type: 'reminder.group.created';
  aggregateId: string;
  timestamp: number;
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
  timestamp: number;
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
  timestamp: number;
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
  timestamp: number;
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
  timestamp: number;
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
  timestamp: number;
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
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== 业务方法 =====

  // 控制模式管理
  switchToGroupControl(): void;
  switchToIndividualControl(): void;
  toggleControlMode(): void;

  // 组状态管理
  enable(): void;
  pause(): void;
  toggle(): void;

  // 批量操作
  enableAllTemplates(): Promise<void>;
  pauseAllTemplates(): Promise<void>;

  // 快捷组合操作
  enableGroupAndAllTemplates(): Promise<void>;
  pauseGroupAndAllTemplates(): Promise<void>;

  // 统计
  updateStats(): Promise<void>;
  getTemplatesCount(): Promise<number>;
  getActiveTemplatesCount(): Promise<number>;

  // 状态管理
  activate(): void;
  softDelete(): void;
  restore(): void;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): ReminderGroupServerDTO;

  toClientDTO(): ReminderGroupClientDTO;
  /**
   * 转换为 Persistence DTO (数据库)
   */
  toPersistenceDTO(): ReminderGroupPersistenceDTO;
}

/**
 * Reminder Group 静态工厂方法接口
 */
export interface ReminderGroupServerStatic {
  /**
   * 创建新的 Reminder Group 聚合根（静态工厂方法）
   */
  create(params: {
    accountUuid: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    controlMode?: ControlMode;
    order?: number;
  }): ReminderGroupServer;

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: ReminderGroupServerDTO): ReminderGroupServer;

  /**
   * 从 Persistence DTO 创建实体
   */
  fromPersistenceDTO(dto: ReminderGroupPersistenceDTO): ReminderGroupServer;
}
