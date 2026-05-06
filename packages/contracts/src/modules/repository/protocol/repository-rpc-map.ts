import type { RepositoryClientDTO } from '../aggregates/repository-client';
import type { ResourceClientDTO } from '../aggregates/resource-client';
import type { ResourceBookmarkClientDTO } from '../entities/resource-bookmark-client';
import type { UploadResourcesResponseDTO } from '../dtos/upload-resource.api-dto';
import type {
  UploadResourceFileDTO,
  UploadResourcesRequestDTO,
} from '../dtos/upload-resource.api-dto';
import type {
  CreateResourceBookmarkRequestDTO,
  UpdateResourceBookmarkRequestDTO,
  ReorderResourceBookmarksRequestDTO,
} from '../dtos/resource-bookmark.api-dto';
import type {
  CreateResourceReq as CreateResourceZodReq,
  UpdateResourceReq as UpdateResourceZodReq,
} from '../api/repository.dto';
import type { RepositoryId, ResourceId, FolderId } from '../../../primitives';

// === Repository Module RPC Map ===
export type RepositoryRpcMap = {
  // === Repository Operations ===
  'repository:current': [void, RepositoryClientDTO | null];

  // === Resource Operations ===
  'resource:create': [{ repositoryId: RepositoryId } & CreateResourceZodReq, ResourceClientDTO];
  'resource:update': [{ resourceId: ResourceId } & UpdateResourceZodReq, ResourceClientDTO];
  'resource:get': [{ resourceId: ResourceId }, ResourceClientDTO];
  'resource:list': [
    { repositoryId: RepositoryId; folderId?: FolderId; status?: string },
    ResourceClientDTO[],
  ];
  'resource:delete': [{ resourceId: ResourceId; hardDelete?: boolean }, { ok: boolean }];
  'resource:search': [{ repositoryId: RepositoryId; keyword: string }, ResourceClientDTO[]];
  'resource:move': [{ resourceId: ResourceId; targetFolderId: FolderId }, ResourceClientDTO];
  'resource:upload': [
    {
      repositoryId: RepositoryId;
      files: UploadResourceFileDTO[];
      metadata?: UploadResourcesRequestDTO;
    },
    UploadResourcesResponseDTO,
  ];

  // === Bookmark Operations ===
  'resource-bookmark:create': [
    { repositoryId: RepositoryId; request: CreateResourceBookmarkRequestDTO },
    ResourceBookmarkClientDTO,
  ];
  'resource-bookmark:update': [
    { repositoryId: RepositoryId; bookmarkId: string; request: UpdateResourceBookmarkRequestDTO },
    ResourceBookmarkClientDTO,
  ];
  'resource-bookmark:reorder': [
    { repositoryId: RepositoryId; request: ReorderResourceBookmarksRequestDTO },
    ResourceBookmarkClientDTO[],
  ];
  'resource-bookmark:delete': [{ repositoryId: RepositoryId; bookmarkId: string }, { ok: boolean }];
  'resource-bookmark:list': [{ repositoryId: RepositoryId }, ResourceBookmarkClientDTO[]];
};
