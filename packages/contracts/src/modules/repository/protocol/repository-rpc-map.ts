import type { RepositoryClientDTO } from '../aggregates/repository-client';
import type { ResourceClientDTO } from '../aggregates/resource-client';
import type { ResourceBookmarkClientDTO } from '../entities/resource-bookmark-client';
import type {
  UploadResourcesResponseDTO,
  CreateResourceBookmarkRequestDTO,
  UpdateResourceBookmarkRequestDTO,
  ReorderResourceBookmarksRequestDTO,
} from '../dtos';
import type { CreateResourceZodReq, UpdateResourceZodReq } from '../api';

// === Repository Module RPC Map ===
export type RepositoryRpcMap = {
  // === Repository Operations ===
  'repository:current': [void, RepositoryClientDTO | null];

  // === Resource Operations ===
  'resource:create': [{ repositoryId: string } & CreateResourceZodReq, ResourceClientDTO];
  'resource:update': [{ resourceId: string } & UpdateResourceZodReq, ResourceClientDTO];
  'resource:get': [{ resourceId: string }, ResourceClientDTO];
  'resource:list': [
    { repositoryId: string; folderId?: string; status?: string },
    ResourceClientDTO[],
  ];
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
