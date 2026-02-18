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
} from '@dailyuse/contracts/repository';
import type {
  IRepositoryApiClient,
  CreateRepositoryRequest,
  CreateFolderRequest,
} from '@/infrastructure-client/adapters/types';
import { Repository } from '@/domain-client/aggregates/repository';

export class RepositoryClientService {
  constructor(private readonly repositoryApi: IRepositoryApiClient) {}

  // ===== Repository CRUD =====

  async createRepository(request: CreateRepositoryRequest): Promise<Result<Repository>> {
    const result = await this.repositoryApi.createRepository(request);
    return mapResult(result, (dto) => Repository.fromDTO(dto));
  }

  async getRepositories(): Promise<Result<Repository[]>> {
    const result = await this.repositoryApi.getRepositories();
    return mapResult(result, (dtos) => dtos.map((dto) => Repository.fromDTO(dto)));
  }

  async getRepositoryById(id: string): Promise<Result<Repository>> {
    const result = await this.repositoryApi.getRepositoryById(id);
    return mapResult(result, (dto) => Repository.fromDTO(dto));
  }

  async deleteRepository(id: string): Promise<Result<void>> {
    return this.repositoryApi.deleteRepository(id);
  }

  // ===== Folder Operations =====

  async createFolder(request: CreateFolderRequest): Promise<Result<FolderClientDTO>> {
    return this.repositoryApi.createFolder(request);
  }

  async getFolderContents(folderId: string): Promise<Result<{
    folders: FolderClientDTO[];
    resources: ResourceClientDTO[];
  }>> {
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

  async getResource(id: string): Promise<Result<ResourceClientDTO>> {
    return this.repositoryApi.getResource(id);
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
}
