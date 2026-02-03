import type { RepositoryClientDTO } from '../aggregates/repository-client';
import type { ResourceClientDTO } from '../aggregates/resource-client';
import type { ResourceBookmarkClientDTO } from '../entities/resource-bookmark-client';

// === Repository Module RPC Map ===
export type RepositoryRpcMap = {
  // === Repository Operations ===
  'repository:create': [{ name: string; type: string; path?: string; description?: string; config?: Record<string, unknown> }, RepositoryClientDTO];
  'repository:update': [{ repositoryId: string; name?: string; description?: string; config?: Record<string, unknown> }, RepositoryClientDTO];
  'repository:get': [{ repositoryId: string }, RepositoryClientDTO];
  'repository:list': [{ status?: string; type?: string }, RepositoryClientDTO[]];
  'repository:delete': [{ repositoryId: string; hardDelete?: boolean }, { ok: boolean }];
  'repository:archive': [{ repositoryId: string }, RepositoryClientDTO];
  'repository:unarchive': [{ repositoryId: string }, RepositoryClientDTO];
  
  // === Resource Operations ===
  'resource:create': [{ repositoryId: string; name: string; type: string; mimeType?: string; content?: string; folderId?: string }, ResourceClientDTO];
  'resource:update': [{ resourceId: string; name?: string; content?: string; metadata?: Record<string, unknown> }, ResourceClientDTO];
  'resource:get': [{ resourceId: string }, ResourceClientDTO];
  'resource:list': [{ repositoryId: string; folderId?: string; status?: string }, ResourceClientDTO[]];
  'resource:delete': [{ resourceId: string; hardDelete?: boolean }, { ok: boolean }];
  'resource:search': [{ repositoryId: string; keyword: string }, ResourceClientDTO[]];
  'resource:move': [{ resourceId: string; targetFolderId: string }, ResourceClientDTO];
  
  // === Bookmark Operations ===
  'resource-bookmark:create': [{ resourceId: string; name?: string }, ResourceBookmarkClientDTO];
  'resource-bookmark:delete': [{ bookmarkId: string }, { ok: boolean }];
  'resource-bookmark:list': [{ resourceId?: string }, ResourceBookmarkClientDTO[]];
};
