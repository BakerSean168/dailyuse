/**
 * Resource Bookmark API DTOs
 * 资源书签 API 数据传输对象
 */
import type { ResourceBookmarkClientDTO } from '../entities/resource-bookmark-client';
import type { ResourceId, BookmarkId } from '../../../primitives';

/**
 * 创建书签请求 DTO
 */
export interface CreateResourceBookmarkRequestDTO {
  resourceId: ResourceId;
  aliasName?: string;
  icon?: string;
  color?: string;
}

/**
 * 更新书签请求 DTO
 */
export interface UpdateResourceBookmarkRequestDTO {
  aliasName?: string | null;
  icon?: string | null;
  color?: string | null;
}

/**
 * 批量重新排序请求 DTO
 */
export interface ReorderResourceBookmarksRequestDTO {
  bookmarkIds: BookmarkId[];
}

/**
 * 删除书签请求 DTO
 */
export interface DeleteResourceBookmarkRequestDTO {
  bookmarkId: BookmarkId;
}

/**
 * 获取书签响应 DTO
 */
export type ResourceBookmarkResponseDTO = ResourceBookmarkClientDTO;

/**
 * 获取书签列表响应 DTO
 */
export type ResourceBookmarkListResponseDTO = ResourceBookmarkClientDTO[];
