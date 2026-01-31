/**
 * Bookmark Contracts
 * Story 11.4: Bookmarks 功能
 */

export type BookmarkTargetType = 'resource' | 'folder';

export interface Bookmark {
  uuid: string;
  name: string;
  targetUuid: string;
  targetType: BookmarkTargetType;
  repositoryUuid: string;
  order: number;
  icon?: string;
  createdAt: string;
}

export interface CreateBookmarkRequest {
  name: string;
  targetUuid: string;
  targetType: BookmarkTargetType;
  repositoryUuid: string;
}

export interface UpdateBookmarkRequest {
  name?: string;
  order?: number;
}

export interface BookmarkListResponse {
  bookmarks: Bookmark[];
  total: number;
}
