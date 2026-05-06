/**
 * Resource Bookmark Entity - Client Interface
 * 资源书签实体 - 客户端接口
 */
import type { TransferDate } from '../../../primitives';
import type { ResourceId, IdentityId, BookmarkId } from '../../../primitives';

// ============ DTO 定义 ============

/**
 * Resource Bookmark Client DTO
 * 客户端展示用的数据传输对象
 */
export interface ResourceBookmarkClientDTO {
  id: BookmarkId;
  resourceId: ResourceId;
  identityId: IdentityId;

  aliasName: string | null;
  icon: string | null;
  color: string | null;

  sortOrder: number;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;

  // UI 计算字段
  displayName: string; // 显示名称（aliasName 或资源原名）
  isOwner: boolean; // 是否是当前用户的书签
}
