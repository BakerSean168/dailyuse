/**
 * @deprecated Extract operations to individual service files following governance pattern.
 * Each API operation should have its own service file for better maintainability.
 */

/**
 * Repository Client Service
 *
 * Constructor-injected application service for repository management.
 * Uses port interfaces directly, returning Result<T> types throughout.
 *
 * @module application-client/repository-client-service
 */

import type { Result } from '@dailyuse/contracts/result';
import { map as mapResult } from '@dailyuse/contracts/result';
import type {
  RepositoryClientDTO,
  FolderClientDTO,
  ResourceClientDTO,
  FileTreeResponse,
  SearchRequest,
  SearchResponse,
  UploadResourcesResponseDTO,
  ResourceBookmarkClientDTO,
  CreateResourceBookmarkRequestDTO,
  UpdateResourceBookmarkRequestDTO,
  ReorderResourceBookmarksRequestDTO,
} from '@dailyuse/contracts/repository';
import type {
  IRepositoryApiClient,
  CreateRepositoryRequest,
  CreateFolderRequest,
  CreateResourceRequest,
  UpdateResourceRequest,
  UploadResourcesRequest,
} from '../infrastructure-client/adapters/types';
import { Repository } from '../domain-client/aggregates/Repository';
import { RepositoryId } from '../domain-shared/value-objects/repository-id';
import { RepositoryConfig } from '../domain-shared/value-objects/repository-config';
import { RepositoryStats } from '../domain-shared/value-objects/repository-stats';
import { IdentityId } from '@dailyuse/domain-shared';

// ===== DTO-to-State Mapper =====

function repositoryFromDTO(dto: RepositoryClientDTO): Repository {
  return Repository.load({
    id: RepositoryId.of(dto.id),
    identityId: IdentityId.of(dto.identityId),
    name: dto.name,
    type: dto.type,
    path: dto.path,
    description: dto.description,
    config: RepositoryConfig.fromDTO(dto.config),
    stats: RepositoryStats.fromDTO(dto.stats),
    status: dto.status,
    version: dto.version,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
  });
}

export class RepositoryClientService {
  constructor(private readonly repositoryApi: IRepositoryApiClient) {}

  // ===== Repository CRUD =====

  async createRepository(request: CreateRepositoryRequest): Promise<Result<Repository>> {
    const result = await this.repositoryApi.createRepository(request);
    return mapResult(result, (dto) => repositoryFromDTO(dto));
  }

  async getCurrentRepository(): Promise<Result<Repository | null>> {
    const result = await this.repositoryApi.getCurrentRepository();
    return mapResult(result, (dto) => (dto ? repositoryFromDTO(dto) : null));
  }

  async getRepositoryById(id: string): Promise<Result<Repository>> {
    const result = await this.repositoryApi.getRepositoryById(id);
    return mapResult(result, (dto) => repositoryFromDTO(dto));
  }

  async deleteRepository(id: string): Promise<Result<void>> {
    return this.repositoryApi.deleteRepository(id);
  }

  // ===== Folder Operations =====

  async createFolder(request: CreateFolderRequest): Promise<Result<FolderClientDTO>> {
    return this.repositoryApi.createFolder(request);
  }

  async getFolderContents(folderId: string): Promise<
    Result<{
      folders: FolderClientDTO[];
      resources: ResourceClientDTO[];
    }>
  > {
    return this.repositoryApi.getFolderContents(folderId);
  }

  async renameFolder(id: string, name: string): Promise<Result<FolderClientDTO>> {
    return this.repositoryApi.renameFolder(id, name);
  }

  async moveFolder(id: string, targetParentId: string): Promise<Result<FolderClientDTO>> {
    return this.repositoryApi.moveFolder(id, targetParentId);
  }

  async deleteFolder(id: string): Promise<Result<void>> {
    return this.repositoryApi.deleteFolder(id);
  }

  // ===== File Tree =====

  async getFileTree(repositoryId: string): Promise<Result<FileTreeResponse>> {
    return this.repositoryApi.getFileTree(repositoryId);
  }

  // ===== Search =====

  async search(request: SearchRequest): Promise<Result<SearchResponse>> {
    return this.repositoryApi.search(request);
  }

  // ===== Resource Operations =====

  async listResources(repositoryId: string): Promise<Result<ResourceClientDTO[]>> {
    return this.repositoryApi.listResources(repositoryId);
  }

  async createResource(
    repositoryId: string,
    request: CreateResourceRequest,
  ): Promise<Result<ResourceClientDTO>> {
    return this.repositoryApi.createResource(repositoryId, request);
  }

  async getResource(id: string): Promise<Result<ResourceClientDTO>> {
    return this.repositoryApi.getResource(id);
  }

  async updateResource(
    id: string,
    request: UpdateResourceRequest,
  ): Promise<Result<ResourceClientDTO>> {
    return this.repositoryApi.updateResource(id, request);
  }

  async renameResource(id: string, name: string): Promise<Result<ResourceClientDTO>> {
    return this.repositoryApi.renameResource(id, name);
  }

  async moveResource(id: string, targetFolderId: string): Promise<Result<ResourceClientDTO>> {
    return this.repositoryApi.moveResource(id, targetFolderId);
  }

  async deleteResource(id: string): Promise<Result<void>> {
    return this.repositoryApi.deleteResource(id);
  }

  async uploadResources(
    repositoryId: string,
    request: UploadResourcesRequest,
  ): Promise<Result<UploadResourcesResponseDTO>> {
    return this.repositoryApi.uploadResources(repositoryId, request);
  }

  async listBookmarks(repositoryId: string): Promise<Result<ResourceBookmarkClientDTO[]>> {
    return this.repositoryApi.listBookmarks(repositoryId);
  }

  async createBookmark(
    repositoryId: string,
    request: CreateResourceBookmarkRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO>> {
    return this.repositoryApi.createBookmark(repositoryId, request);
  }

  async updateBookmark(
    repositoryId: string,
    bookmarkId: string,
    request: UpdateResourceBookmarkRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO>> {
    return this.repositoryApi.updateBookmark(repositoryId, bookmarkId, request);
  }

  async reorderBookmarks(
    repositoryId: string,
    request: ReorderResourceBookmarksRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO[]>> {
    return this.repositoryApi.reorderBookmarks(repositoryId, request);
  }

  async deleteBookmark(repositoryId: string, bookmarkId: string): Promise<Result<void>> {
    return this.repositoryApi.deleteBookmark(repositoryId, bookmarkId);
  }
}
