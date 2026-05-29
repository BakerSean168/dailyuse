/**
 * Resource Bookmark Entity - Server Interface
 * 资源书签实体 - 服务端接口
 *
 * 作为 Repository 模块的子实体，用于实现用户对资源的书签标记功能
 *
 * 【同步支持】
 * - deletedAt: 软删除时间戳
 * - version: 乐观锁版本号
 * - updatedAt: 最后更新时间（增量同步）
 */
import type { TransferDate, ResourceId, IdentityId, BookmarkId } from '../../../primitives';

// ============ DTO 定义 ============

/**
 * Resource Bookmark Server DTO
 */
export interface ResourceBookmarkServerDTO {
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
}

