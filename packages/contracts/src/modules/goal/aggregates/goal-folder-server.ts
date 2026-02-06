/**
 * GoalFolder Aggregate Root - Server Interface
 * 目标文件夹聚合根 - 服务端接口
 */

import type { DomainDate, TransferDate, PersistenceDate, GoalFolderId, IdentityId } from '@/primitives';
import type { FolderType } from '../value-objects/folder-type';

// ============ DTO 定义 ============

/**
 * GoalFolder Server DTO
 */
export interface GoalFolderServerDTO {
  id: GoalFolderId;
  identityId: IdentityId;

  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  parentFolderId: GoalFolderId | null;
  sortOrder: number;
  isSystemFolder: boolean;
  folderType: FolderType | null;
  goalCount: number;
  completedGoalCount: number;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

/**
 * GoalFolder Persistence DTO
 * 注意：使用 camelCase 命名
 */
export interface GoalFolderPersistenceDTO {
  id: GoalFolderId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  parentFolderId: GoalFolderId | null;
  sortOrder: number;
  folderType: FolderType | null;
  goalCount: number;
  completedGoalCount: number;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
  version: number;
}

// 事件定义已移至 protocol/goal-event-map.ts

// ============ 实体接口 ============

/**
 * GoalFolder 聚合根 - Server 接口（实例方法）
 */
export interface GoalFolderServer {
  // 基础属性
  id: GoalFolderId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  parentFolderId: GoalFolderId | null;
  sortOrder: number;
  isSystemFolder: boolean;
  folderType: FolderType | null;
  goalCount: number;
  completedGoalCount: number;

  // 时间戳
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;

  // 版本控制
  version: number;
}
