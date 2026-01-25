/**
 * GoalFolder Aggregate Root - Client Interface
 * 目标文件夹聚合根 - 客户端接口
 */

import type { FolderType } from '../enums';
import type { GoalFolderServerDTO } from './GoalFolderServer';

// ============ DTO 定义 ============

/**
 * GoalFolder Client DTO
 */
export interface GoalFolderClientDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  parentFolderUuid?: string | null;
  sortOrder: number;
  isSystemFolder: boolean;
  folderType?: FolderType | null;
  goalCount: number;
  completedGoalCount: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // UI 计算字段
  displayName: string;
  displayIcon: string;
  completionRate: number; // 0-100
  isDeleted: boolean;
  activeGoalCount: number; // goalCount - completedGoalCount
}

// ============ 实体接口 ============

/**
 * GoalFolder 聚合根 - Client 接口（实例方法）
 */
export interface GoalFolderClient {
  // 基础属性
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  parentFolderUuid?: string | null;
  sortOrder: number;
  isSystemFolder: boolean;
  folderType?: FolderType | null;
  goalCount: number;
  completedGoalCount: number;

  // 时间戳
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // UI 计算属性
  displayName: string;
  displayIcon: string;
  completionRate: number;
  isDeleted: boolean;
  activeGoalCount: number;

  // ===== UI 业务方法 =====

  /**
   * 获取显示名称
   */
  getDisplayName(): string;

  /**
   * 获取图标
   */
  getIcon(): string;

  /**
   * 获取完成度文本
   */
  getCompletionText(): string;

  /**
   * 获取徽章
   */
  getBadge(): { text: string; color: string } | null;

  // ===== 操作判断方法 =====

  /**
   * 是否可以重命名（系统文件夹不能重命名）
   */
  canRename(): boolean;

  /**
   * 是否可以删除（系统文件夹不能删除）
   */
  canDelete(): boolean;

  /**
   * 是否可以移动
   */
  canMove(): boolean;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): GoalFolderServerDTO;

  /**
   * 转换为 Client DTO
   */
  toClientDTO(): GoalFolderClientDTO;
}

/**
 * GoalFolder 静态工厂方法接口
 * 注意：TypeScript 接口不能包含静态方法，这些方法应该在类上实现
 */
export interface GoalFolderClientStatic {
  /**
   * 创建新的 GoalFolder 聚合根（静态工厂方法）
   * @param params 创建参数
   * @returns 新的 GoalFolder 实例
   */
  create(params: {
    accountUuid: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    parentFolderUuid?: string;
  }): GoalFolderClient;

  /**
   * 创建用于创建表单的空 GoalFolder 实例
   */
  forCreate(accountUuid: string): GoalFolderClient;

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: GoalFolderServerDTO): GoalFolderClient;

  /**
   * 从 Client DTO 创建实体
   */
  fromClientDTO(dto: GoalFolderClientDTO): GoalFolderClient;
}

/**
 * GoalFolder 实例方法接口（扩展，包含 clone）
 */
export interface GoalFolderClientInstance extends GoalFolderClient {
  /**
   * 克隆当前实体（用于编辑表单）
   */
  clone(): GoalFolderClient;
}
