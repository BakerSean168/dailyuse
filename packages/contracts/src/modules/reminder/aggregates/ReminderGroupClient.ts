/**
 * Reminder Group Aggregate Root - Client Interface
 * 提醒分组聚合根 - 客户端接口
 */

import type { ControlMode, ReminderStatus } from '../enums';
import type { ReminderGroupServerDTO } from './ReminderGroupServer';
import type { GroupStatsServerDTO, GroupStatsClientDTO } from '../value-objects';

// ============ DTO 定义 ============

/**
 * Reminder Group Client DTO
 */
export interface ReminderGroupClientDTO {
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
  stats: GroupStatsClientDTO;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // UI 扩展
  displayName: string;
  controlModeText: string; // "组控制" | "个体控制"
  statusText: string;
  templateCountText: string; // "5 个提醒"
  activeStatusText: string; // "3 个活跃"
  controlDescription: string; // "所有提醒统一启用" | "提醒独立控制"
}

// ============ 实体接口 ============

/**
 * Reminder Group 聚合根 - Client 接口
 */
export interface ReminderGroupClient {
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
  stats: GroupStatsClientDTO;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // UI 扩展
  displayName: string;
  controlModeText: string;
  statusText: string;
  templateCountText: string;
  activeStatusText: string;
  controlDescription: string;

  // ===== UI 业务方法 =====

  // 格式化展示
  getStatusBadge(): { text: string; color: string };
  getControlModeBadge(): { text: string; color: string; icon: string };
  getIcon(): string;
  getColorStyle(): string;

  // 操作判断
  canSwitchMode(): boolean;
  canEnableAll(): boolean;
  canPauseAll(): boolean;
  canEdit(): boolean;
  canDelete(): boolean;
  hasTemplates(): boolean;
  isGroupControlled(): boolean;

  // ===== 转换方法 =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): ReminderGroupServerDTO;
}

/**
 * Reminder Group Client 静态工厂方法接口
 */
export interface ReminderGroupClientStatic {
  /**
   * 从 Server DTO 创建客户端实体
   */
  fromServerDTO(dto: ReminderGroupServerDTO): ReminderGroupClient;
}
