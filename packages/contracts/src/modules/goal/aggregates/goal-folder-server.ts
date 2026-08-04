/**
 * GoalFolder Aggregate Root - Server Interface
 * 目标文件夹聚合根 - 服务端接口
 */

import type { TransferDate, GoalFolderId, IdentityId } from '../../../primitives';
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
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}
