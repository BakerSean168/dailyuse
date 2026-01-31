/**
 * GoalFolder Aggregate Root - Client Interface
 * 目标文件夹聚合根 - 客户端接口
 */

import type { DomainDate, TransferDate, GoalFolderId, IdentityId } from '@/primitives';
import type { FolderType } from '../value-objects/folder-type';
import type { GoalFolderServerDTO } from './goal-folder-server';

// ============ DTO 定义 ============

/**
 * GoalFolder Client DTO
 */
export interface GoalFolderClientDTO {
  id: string;
  identityId: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  parentFolderId: string | null;
  sortOrder: number;
  isSystemFolder: boolean;
  folderType: FolderType | null;
  goalCount: number;
  completedGoalCount: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;

  // UI 计算字段
  displayName: string;
  displayIcon: string;
  completionRate: number; // 0-100
  activeGoalCount: number; // goalCount - completedGoalCount
}

// ============ 实体接口 ============

/**
 * GoalFolder 聚合根 - Client 接口（实例方法）
 */
export interface GoalFolderClient {
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

  // UI 计算属性
  displayName: string;
  displayIcon: string;
  completionRate: number;
  isDeleted: boolean;
  activeGoalCount: number;
}
