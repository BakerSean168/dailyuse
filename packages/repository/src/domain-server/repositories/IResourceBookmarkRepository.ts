import type {
  ResourceBookmarkClientDTO,
  ResourceBookmarkServerDTO,
} from '@dailyuse/contracts/repository';
import type { BookmarkId } from '@dailyuse/contracts/primitives';

export interface CreateResourceBookmarkInput {
  repositoryId: string;
  identityId: string;
  resourceId: string;
  aliasName?: string | null;
  icon?: string | null;
  color?: string | null;
}

export interface UpdateResourceBookmarkInput {
  repositoryId: string;
  identityId: string;
  bookmarkId: BookmarkId;
  aliasName?: string | null;
  icon?: string | null;
  color?: string | null;
}

export interface DeleteResourceBookmarkInput {
  repositoryId: string;
  identityId: string;
  bookmarkId: BookmarkId;
}

export interface ReorderResourceBookmarksInput {
  repositoryId: string;
  identityId: string;
  bookmarkIds: BookmarkId[];
}

export interface IResourceBookmarkRepository {
  list(repositoryId: string, identityId: string): Promise<ResourceBookmarkServerDTO[]>;
  create(input: CreateResourceBookmarkInput): Promise<ResourceBookmarkServerDTO>;
  update(input: UpdateResourceBookmarkInput): Promise<ResourceBookmarkServerDTO>;
  reorder(input: ReorderResourceBookmarksInput): Promise<ResourceBookmarkServerDTO[]>;
  delete(input: DeleteResourceBookmarkInput): Promise<void>;
}

export function toBookmarkClientDTO(
  bookmark: ResourceBookmarkServerDTO,
  displayName: string,
): ResourceBookmarkClientDTO {
  return {
    ...bookmark,
    resourceId: bookmark.resourceId as ResourceBookmarkClientDTO['resourceId'],
    identityId: bookmark.identityId as ResourceBookmarkClientDTO['identityId'],
    displayName,
    isOwner: true,
  };
}
