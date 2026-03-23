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
import { fail, ok } from '@dailyuse/contracts/result';
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

function validateRepositoryDTO(dto: RepositoryClientDTO): Result<RepositoryClientDTO> {
  if (typeof dto.id !== 'string') {
    return fail({
      code: 'INVALID_RESPONSE',
      message: 'Invalid RepositoryClientDTO: id must be a string',
    });
  }

  if (typeof dto.identityId !== 'string') {
    return fail({
      code: 'INVALID_RESPONSE',
      message: 'Invalid RepositoryClientDTO: identityId must be a string',
    });
  }

  return ok(dto);
}

function repositoryFromDTO(dto: RepositoryClientDTO): Result<Repository> {
  const validation = validateRepositoryDTO(dto);
  if (!validation.ok) {
    return validation;
  }

  return ok(
    Repository.load({
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
    }),
  );
}

export class RepositoryClientService {
  constructor(private readonly repositoryApi: IRepositoryApiClient) {
    this.getCurrentRepository = this.getCurrentRepository.bind(this);
    this.createFolder = this.createFolder.bind(this);
    this.getFolderContents = this.getFolderContents.bind(this);
    this.renameFolder = this.renameFolder.bind(this);
    this.moveFolder = this.moveFolder.bind(this);
    this.deleteFolder = this.deleteFolder.bind(this);
    this.getFileTree = this.getFileTree.bind(this);
    this.search = this.search.bind(this);
    this.listResources = this.listResources.bind(this);
    this.createResource = this.createResource.bind(this);
    this.getResource = this.getResource.bind(this);
    this.updateResource = this.updateResource.bind(this);
    this.renameResource = this.renameResource.bind(this);
    this.moveResource = this.moveResource.bind(this);
    this.deleteResource = this.deleteResource.bind(this);
    this.uploadResources = this.uploadResources.bind(this);
    this.listBookmarks = this.listBookmarks.bind(this);
    this.createBookmark = this.createBookmark.bind(this);
    this.updateBookmark = this.updateBookmark.bind(this);
    this.reorderBookmarks = this.reorderBookmarks.bind(this);
    this.deleteBookmark = this.deleteBookmark.bind(this);
  }

  async getCurrentRepository(): Promise<Result<Repository | null>> {
    const result = await this.repositoryApi.getCurrentRepository();
    if (!result.ok) {
      return result;
    }

    if (result.data === null) {
      return ok(null, result.meta);
    }

    const mapped = repositoryFromDTO(result.data);
    return mapped.ok ? ok(mapped.data, result.meta) : mapped;
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
