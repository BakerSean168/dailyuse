import type { RepositoryClientDTO } from '../aggregates/repository-client';
import type { ResourceClientDTO } from '../aggregates/resource-client';
import type { ResourceBookmarkClientDTO } from '../entities/resource-bookmark-client';
import type {
  CreateRepositoryReq,
  UpdateRepositoryReq,
  GetRepositoryReq,
  ListRepositoryReq,
  CreateResourceReq,
  UpdateResourceReq,
  GetResourceReq,
  ListResourceReq,
  ResourceBookmarkCreateReq,
} from '../api';

// === Repository Module RPC Map ===
export type RepositoryRpcMap = {
  // === Repository Operations ===
  'repository:create': [CreateRepositoryReq, RepositoryClientDTO];
  'repository:update': [UpdateRepositoryReq, RepositoryClientDTO];
  'repository:get': [GetRepositoryReq, RepositoryClientDTO];
  'repository:list': [ListRepositoryReq, RepositoryClientDTO[]];
  'repository:delete': [{ repositoryId: string; hardDelete?: boolean }, { ok: boolean }];
  'repository:archive': [{ repositoryId: string }, RepositoryClientDTO];
  'repository:unarchive': [{ repositoryId: string }, RepositoryClientDTO];
  
  // === Resource Operations ===
  'resource:create': [CreateResourceReq, ResourceClientDTO];
  'resource:update': [UpdateResourceReq, ResourceClientDTO];
  'resource:get': [GetResourceReq, ResourceClientDTO];
  'resource:list': [ListResourceReq, ResourceClientDTO[]];
  'resource:delete': [{ resourceId: string; hardDelete?: boolean }, { ok: boolean }];
  'resource:search': [{ repositoryId: string; keyword: string }, ResourceClientDTO[]];
  'resource:move': [{ resourceId: string; targetFolderId: string }, ResourceClientDTO];
  
  // === Bookmark Operations ===
  'resource-bookmark:create': [ResourceBookmarkCreateReq, ResourceBookmarkClientDTO];
  'resource-bookmark:delete': [{ bookmarkId: string }, { ok: boolean }];
  'resource-bookmark:list': [{ resourceId?: string }, ResourceBookmarkClientDTO[]];
};
