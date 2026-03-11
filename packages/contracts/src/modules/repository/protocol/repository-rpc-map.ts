import type { RepositoryClientDTO } from '../aggregates/repository-client';
import type { ResourceClientDTO } from '../aggregates/resource-client';
import type { ResourceBookmarkClientDTO } from '../entities/resource-bookmark-client';
import type {
  UploadResourcesResponseDTO,
  CreateResourceBookmarkRequestDTO,
  UpdateResourceBookmarkRequestDTO,
  ReorderResourceBookmarksRequestDTO,
} from '../dtos';
import type {
  CreateRepositoryReq,
  UpdateRepositoryReq,
  GetRepositoryReq,
  ListRepositoryReq,
  CreateResourceReq,
  UpdateResourceReq,
  GetResourceReq,
  ListResourceReq,
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
  'resource:create': [{ repositoryId: string } & CreateResourceReq, ResourceClientDTO];
  'resource:update': [UpdateResourceReq, ResourceClientDTO];
  'resource:get': [GetResourceReq, ResourceClientDTO];
  'resource:list': [ListResourceReq, ResourceClientDTO[]];
  'resource:delete': [{ resourceId: string; hardDelete?: boolean }, { ok: boolean }];
  'resource:search': [{ repositoryId: string; keyword: string }, ResourceClientDTO[]];
  'resource:move': [{ resourceId: string; targetFolderId: string }, ResourceClientDTO];
  'resource:upload': [
    {
      repositoryId: string;
      files: import('../dtos').UploadResourceFileDTO[];
      metadata?: import('../dtos').UploadResourcesRequestDTO;
    },
    UploadResourcesResponseDTO,
  ];

  // === Bookmark Operations ===
  'resource-bookmark:create': [
    { repositoryId: string; request: CreateResourceBookmarkRequestDTO },
    ResourceBookmarkClientDTO,
  ];
  'resource-bookmark:update': [
    { repositoryId: string; bookmarkId: string; request: UpdateResourceBookmarkRequestDTO },
    ResourceBookmarkClientDTO,
  ];
  'resource-bookmark:reorder': [
    { repositoryId: string; request: ReorderResourceBookmarksRequestDTO },
    ResourceBookmarkClientDTO[],
  ];
  'resource-bookmark:delete': [{ repositoryId: string; bookmarkId: string }, { ok: boolean }];
  'resource-bookmark:list': [{ repositoryId: string }, ResourceBookmarkClientDTO[]];
};
