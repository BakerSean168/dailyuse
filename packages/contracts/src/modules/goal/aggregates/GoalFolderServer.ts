/**
 * GoalFolder Aggregate Root - Server Interface
 * 目标文件夹聚合根 - 服务端接口
 */

import type { FolderType } from '../enums';

// ============ DTO 定义 ============

/**
 * GoalFolder Server DTO
 */
export interface GoalFolderServerDTO {
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
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  deletedAt?: number | null; // epoch ms
}

/**
 * GoalFolder Persistence DTO
 * 注意：使用 camelCase 命名
 */
export interface GoalFolderPersistenceDTO {
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
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// ============ 领域事件 ============

/**
 * 文件夹创建事件
 */
export interface GoalFolderCreatedEvent {
  type: 'goal_folder.created';
  aggregateId: string; // folderUuid
  timestamp: Date;
  payload: {
    folder: GoalFolderServerDTO;
    accountUuid: string;
  };
}

/**
 * 文件夹更新事件
 */
export interface GoalFolderUpdatedEvent {
  type: 'goal_folder.updated';
  aggregateId: string;
  timestamp: Date;
  payload: {
    folder: GoalFolderServerDTO;
    previousData: Partial<GoalFolderServerDTO>;
    changes: string[];
  };
}

/**
 * 文件夹删除事件
 */
export interface GoalFolderDeletedEvent {
  type: 'goal_folder.deleted';
  aggregateId: string;
  timestamp: Date;
  payload: {
    folderUuid: string;
    deletedAt: Date;
    isSoftDelete: boolean;
  };
}

/**
 * 文件夹统计更新事件
 */
export interface GoalFolderStatsUpdatedEvent {
  type: 'goal_folder.stats_updated';
  aggregateId: string;
  timestamp: Date;
  payload: {
    folderUuid: string;
    goalCount: number;
    completedGoalCount: number;
  };
}

// ============ 实体接口 ============

/**
 * GoalFolder 聚合根 - Server 接口（实例方法）
 */
export interface GoalFolderServer {
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

  // 时间戳 (统一使用 number epoch ms)
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // 业务方法
  rename(newName: string): void;
  updateDescription(description: string): void;
  updateIcon(icon: string): void;
  updateColor(color: string): void;
  updateStatistics(goalCount: number, completedCount: number): void;
  softDelete(): void;
  restore(): void;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): GoalFolderServerDTO;

  /**
   * 转换为 Persistence DTO
   */
  toPersistenceDTO(): GoalFolderPersistenceDTO;
}

/**
 * GoalFolder 静态工厂方法接口
 * 注意：TypeScript 接口不能包含静态方法，这些方法应该在类上实现
 */
export interface GoalFolderServerStatic {
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
  }): GoalFolderServer;

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: GoalFolderServerDTO): GoalFolderServer;

  /**
   * 从 Persistence DTO 创建实体
   */
  fromPersistenceDTO(dto: GoalFolderPersistenceDTO): GoalFolderServer;
}
