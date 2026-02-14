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
import { Repository } from '@/domain-client/aggregates/Repository';

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

  async getRepositoryById(uuid: string): Promise<Result<Repository>> {
    const result = await this.repositoryApi.getRepositoryById(uuid);
    return mapResult(result, (dto) => Repository.fromDTO(dto));
  }

  async deleteRepository(uuid: string): Promise<Result<void>> {
    return this.repositoryApi.deleteRepository(uuid);
  }

  // ===== Folder Operations =====

  async createFolder(request: CreateFolderRequest): Promise<Result<FolderClientDTO>> {
    return this.repositoryApi.createFolder(request);
  }

  async getFolderContents(folderUuid: string): Promise<Result<{
    folders: FolderClientDTO[];
    resources: ResourceClientDTO[];
  }>> {
    return this.repositoryApi.getFolderContents(folderUuid);
  }

  async renameFolder(uuid: string, name: string): Promise<Result<FolderClientDTO>> {
    return this.repositoryApi.renameFolder(uuid, name);
  }

  async moveFolder(uuid: string, targetParentUuid: string): Promise<Result<FolderClientDTO>> {
    return this.repositoryApi.moveFolder(uuid, targetParentUuid);
  }

  async deleteFolder(uuid: string): Promise<Result<void>> {
    return this.repositoryApi.deleteFolder(uuid);
  }

  // ===== File Tree =====

  async getFileTree(repositoryUuid: string): Promise<Result<FileTreeResponse>> {
    return this.repositoryApi.getFileTree(repositoryUuid);
  }

  // ===== Search =====

  async search(request: SearchRequest): Promise<Result<SearchResponse>> {
    return this.repositoryApi.search(request);
  }

  // ===== Resource Operations =====

  async getResource(uuid: string): Promise<Result<ResourceClientDTO>> {
    return this.repositoryApi.getResource(uuid);
  }

  async renameResource(uuid: string, name: string): Promise<Result<ResourceClientDTO>> {
    return this.repositoryApi.renameResource(uuid, name);
  }

  async moveResource(uuid: string, targetFolderUuid: string): Promise<Result<ResourceClientDTO>> {
    return this.repositoryApi.moveResource(uuid, targetFolderUuid);
  }

  async deleteResource(uuid: string): Promise<Result<void>> {
    return this.repositoryApi.deleteResource(uuid);
  }
}
