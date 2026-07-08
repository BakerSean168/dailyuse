import type { Result } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import type {
  ResourceClientDTO,
  UploadResourcesResponseDTO,
} from '@dailyuse/contracts/repository';

/**
 * Transport-neutral callable application surface.
 * 传输层无关的可调用应用层门面。
 */
export interface RepositoryApplicationPort {
  getCurrentRepository(ctx: Context): Promise<Result<unknown>>;
  createResource(
    data: {
      repositoryId: string;
      folderId?: string;
      name: string;
      type: string;
      path?: string;
      content?: string;
    },
    ctx: Context,
  ): Promise<Result<ResourceClientDTO>>;
  listResources(
    repositoryId: string,
    filters?: { folderId?: string; status?: string },
  ): Promise<Result<ResourceClientDTO[]>>;
  getResource(id: string): Promise<Result<unknown>>;
  updateResource(
    id: string,
    data: {
      name?: string;
      metadata?: Record<string, unknown>;
      content?: string;
    },
  ): Promise<Result<ResourceClientDTO>>;
  moveResource(id: string, targetFolderId: string): Promise<Result<ResourceClientDTO>>;
  deleteResource(id: string): Promise<Result<void>>;
  uploadResources(
    data: {
      repositoryId: string;
      files: unknown[];
      metadata?: unknown;
    },
    ctx: Context,
  ): Promise<Result<UploadResourcesResponseDTO>>;
  updateRepositoryStats(id: string, data: Record<string, unknown>): Promise<Result<unknown>>;
  createFolder(
    data: {
      repositoryId: string;
      name: string;
      parentId?: string;
      order?: number;
    },
    ctx: Context,
  ): Promise<Result<unknown>>;
  getFolderTree(repositoryId: string): Promise<Result<unknown>>;
  getFolder(id: string): Promise<Result<unknown>>;
  renameFolder(id: string, newName: string): Promise<Result<unknown>>;
  moveFolder(id: string, newParentId: string | null): Promise<Result<unknown>>;
  deleteFolder(id: string): Promise<Result<unknown>>;
  listResourceBookmarks(repositoryId: string, ctx: Context): Promise<Result<unknown>>;
  createResourceBookmark(
    repositoryId: string,
    data: {
      resourceId: string;
      aliasName?: string;
      icon?: string;
      color?: string;
    },
    ctx: Context,
  ): Promise<Result<unknown>>;
  updateResourceBookmark(
    repositoryId: string,
    bookmarkId: string,
    data: {
      aliasName?: string;
      icon?: string;
      color?: string;
    },
    ctx: Context,
  ): Promise<Result<unknown>>;
  reorderResourceBookmarks(
    repositoryId: string,
    data: {
      bookmarkIds: string[];
    },
    ctx: Context,
  ): Promise<Result<unknown>>;
  deleteResourceBookmark(
    repositoryId: string,
    bookmarkId: string,
    ctx: Context,
  ): Promise<Result<unknown>>;
  findActiveRepository(identityId: string): Promise<Result<unknown>>;
}
