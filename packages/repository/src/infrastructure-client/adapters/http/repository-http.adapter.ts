/**
 * Repository HTTP Adapter
 *
 * HTTP implementation of IRepositoryApiClient.
 * Uses IResultHttpClient for making HTTP requests.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';
import type {
  IRepositoryApiClient,
  CreateRepositoryRequest,
  CreateFolderRequest,
} from '../types';
import type {
  RepositoryClientDTO,
  FolderClientDTO,
  ResourceClientDTO,
  FileTreeResponse,
  SearchRequest,
  SearchResponse,
} from '@dailyuse/contracts/repository';

/**
 * Repository HTTP Adapter
 *
 * Implements IRepositoryApiClient using HTTP REST API calls.
 */
export class RepositoryHttpAdapter implements IRepositoryApiClient {
  private readonly baseUrl = '/repositories';

  constructor(private readonly httpClient: IResultHttpClient) {}

  // ===== Repository CRUD =====

  async createRepository(request: CreateRepositoryRequest): Promise<Result<RepositoryClientDTO>> {
    return this.httpClient.post(this.baseUrl, request);
  }

  async getRepositories(): Promise<Result<RepositoryClientDTO[]>> {
    return this.httpClient.get(this.baseUrl);
  }

  async getRepositoryById(uuid: string): Promise<Result<RepositoryClientDTO>> {
    return this.httpClient.get(`${this.baseUrl}/${uuid}`);
  }

  async deleteRepository(uuid: string): Promise<Result<void>> {
    return this.httpClient.delete(`${this.baseUrl}/${uuid}`);
  }

  // ===== Folder Operations =====

  async createFolder(request: CreateFolderRequest): Promise<Result<FolderClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${request.repositoryUuid}/folders`, request);
  }

  async getFolderContents(folderUuid: string): Promise<Result<{
    folders: FolderClientDTO[];
    resources: ResourceClientDTO[];
  }>> {
    return this.httpClient.get(`/folders/${folderUuid}/contents`);
  }

  async renameFolder(uuid: string, name: string): Promise<Result<FolderClientDTO>> {
    return this.httpClient.patch(`/folders/${uuid}`, { name });
  }

  async moveFolder(uuid: string, targetParentUuid: string): Promise<Result<FolderClientDTO>> {
    return this.httpClient.post(`/folders/${uuid}/move`, { targetParentUuid });
  }

  async deleteFolder(uuid: string): Promise<Result<void>> {
    return this.httpClient.delete(`/folders/${uuid}`);
  }

  // ===== File Tree =====

  async getFileTree(repositoryUuid: string): Promise<Result<FileTreeResponse>> {
    return this.httpClient.get(`${this.baseUrl}/${repositoryUuid}/tree`);
  }

  // ===== Search =====

  async search(request: SearchRequest): Promise<Result<SearchResponse>> {
    return this.httpClient.post('/search', request);
  }

  // ===== Resource Operations =====

  async getResource(uuid: string): Promise<Result<ResourceClientDTO>> {
    return this.httpClient.get(`/resources/${uuid}`);
  }

  async renameResource(uuid: string, name: string): Promise<Result<ResourceClientDTO>> {
    return this.httpClient.patch(`/resources/${uuid}`, { name });
  }

  async moveResource(uuid: string, targetFolderUuid: string): Promise<Result<ResourceClientDTO>> {
    return this.httpClient.post(`/resources/${uuid}/move`, { targetFolderUuid });
  }

  async deleteResource(uuid: string): Promise<Result<void>> {
    return this.httpClient.delete(`/resources/${uuid}`);
  }
}

/**
 * Factory function to create RepositoryHttpAdapter
 */
export function createRepositoryHttpAdapter(httpClient: IResultHttpClient): RepositoryHttpAdapter {
  return new RepositoryHttpAdapter(httpClient);
}
