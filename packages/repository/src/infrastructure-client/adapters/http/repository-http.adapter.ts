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
  CreateResourceRequest,
  UpdateResourceRequest,
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

  async getRepositoryById(id: string): Promise<Result<RepositoryClientDTO>> {
    return this.httpClient.get(`${this.baseUrl}/${id}`);
  }

  async deleteRepository(id: string): Promise<Result<void>> {
    return this.httpClient.delete(`${this.baseUrl}/${id}`);
  }

  // ===== Folder Operations =====

  async createFolder(request: CreateFolderRequest): Promise<Result<FolderClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${request.repositoryId}/folders`, request);
  }

  async getFolderContents(folderId: string): Promise<
    Result<{
      folders: FolderClientDTO[];
      resources: ResourceClientDTO[];
    }>
  > {
    return this.httpClient.get(`/folders/${folderId}/contents`);
  }

  async renameFolder(id: string, name: string): Promise<Result<FolderClientDTO>> {
    return this.httpClient.patch(`/folders/${id}`, { name });
  }

  async moveFolder(id: string, targetParentId: string): Promise<Result<FolderClientDTO>> {
    return this.httpClient.post(`/folders/${id}/move`, { targetParentId });
  }

  async deleteFolder(id: string): Promise<Result<void>> {
    return this.httpClient.delete(`/folders/${id}`);
  }

  // ===== File Tree =====

  async getFileTree(repositoryId: string): Promise<Result<FileTreeResponse>> {
    return this.httpClient.get(`${this.baseUrl}/${repositoryId}/tree`);
  }

  // ===== Search =====

  async search(request: SearchRequest): Promise<Result<SearchResponse>> {
    return this.httpClient.post('/search', request);
  }

  // ===== Resource Operations =====

  async listResources(repositoryId: string): Promise<Result<ResourceClientDTO[]>> {
    return this.httpClient.get(`${this.baseUrl}/${repositoryId}/resources`);
  }

  async createResource(
    repositoryId: string,
    request: CreateResourceRequest,
  ): Promise<Result<ResourceClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${repositoryId}/resources`, request);
  }

  async getResource(id: string): Promise<Result<ResourceClientDTO>> {
    return this.httpClient.get(`/resources/${id}`);
  }

  async updateResource(
    id: string,
    request: UpdateResourceRequest,
  ): Promise<Result<ResourceClientDTO>> {
    return this.httpClient.put(`/resources/${id}`, request);
  }

  async renameResource(id: string, name: string): Promise<Result<ResourceClientDTO>> {
    return this.httpClient.patch(`/resources/${id}`, { name });
  }

  async moveResource(id: string, targetFolderId: string): Promise<Result<ResourceClientDTO>> {
    return this.httpClient.post(`/resources/${id}/move`, { targetFolderId });
  }

  async deleteResource(id: string): Promise<Result<void>> {
    return this.httpClient.delete(`/resources/${id}`);
  }
}

/**
 * Factory function to create RepositoryHttpAdapter
 */
export function createRepositoryHttpAdapter(httpClient: IResultHttpClient): RepositoryHttpAdapter {
  return new RepositoryHttpAdapter(httpClient);
}
