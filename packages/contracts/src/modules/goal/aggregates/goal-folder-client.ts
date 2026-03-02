/**
 * GoalFolder Aggregate Root - Client Interface
 * 目标文件夹聚合根 - 客户端接口
 */

import type { DomainDate, TransferDate, GoalFolderId, IdentityId } from '../../../primitives';
import type { FolderType } from '../value-objects/folder-type';
import type { GoalFolderServerDTO } from './goal-folder-server';

// ============ DTO 定义 ============

/**
 * GoalFolder Client DTO
 */
export interface GoalFolderClientDTO {
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

  // UI 计算字段
  displayName: string;
  displayIcon: string;
  completionRate: number; // 0-100
  activeGoalCount: number; // goalCount - completedGoalCount
}
