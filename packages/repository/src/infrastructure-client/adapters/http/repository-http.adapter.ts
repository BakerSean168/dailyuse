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
  CreateFolderRequest,
  CreateResourceRequest,
  UpdateResourceRequest,
  UploadResourcesRequest,
} from '../types';
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
import { fail } from '@dailyuse/contracts/result';

function base64ToBytes(value: string): Uint8Array {
  if (typeof atob === 'function') {
    return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
  }
  return Uint8Array.from(Buffer.from(value, 'base64'));
}

/**
 * Repository HTTP Adapter
 *
 * Implements IRepositoryApiClient using HTTP REST API calls.
 */
export class RepositoryHttpAdapter implements IRepositoryApiClient {
  private readonly baseUrl = '/repositories';

  constructor(private readonly httpClient: IResultHttpClient) {}

  async getCurrentRepository(): Promise<Result<RepositoryClientDTO | null>> {
    return this.httpClient.get(`${this.baseUrl}/current`);
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

  async uploadResources(
    repositoryId: string,
    request: UploadResourcesRequest,
  ): Promise<Result<UploadResourcesResponseDTO>> {
    const client = this.httpClient as any;
    const axios = typeof client.getAxiosInstance === 'function' ? client.getAxiosInstance() : null;
    if (!axios) {
      return fail({
        code: 'INTERNAL_ERROR',
        message: 'HTTP client does not support multipart uploads',
      });
    }

    const FormDataCtor = (globalThis as any).FormData;
    const BlobCtor = (globalThis as any).Blob;
    if (!FormDataCtor || !BlobCtor) {
      return fail({
        code: 'INTERNAL_ERROR',
        message: 'Runtime does not support multipart uploads',
      });
    }
    const formData = new FormDataCtor();
    for (const file of request.files) {
      if (typeof (file as any).arrayBuffer === 'function') {
        const bytes = new Uint8Array(await (file as any).arrayBuffer());
        const blob = new BlobCtor([bytes], {
          type: (file as any).type || 'application/octet-stream',
        });
        formData.append('files', blob, (file as any).name);
      } else {
        const uploaded = file as any;
        const blob = new BlobCtor([base64ToBytes(uploaded.contentBase64)], {
          type: uploaded.mimeType || 'application/octet-stream',
        });
        formData.append('files', blob, uploaded.name);
      }
    }
    if (request.folderId) formData.append('folderId', request.folderId);
    if (request.tags) formData.append('tags', JSON.stringify(request.tags));
    if (request.overwritePolicy) formData.append('overwritePolicy', request.overwritePolicy);

    return client.request({
      method: 'post',
      url: `${this.baseUrl}/${repositoryId}/resources/upload`,
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async listBookmarks(repositoryId: string): Promise<Result<ResourceBookmarkClientDTO[]>> {
    return this.httpClient.get(`${this.baseUrl}/${repositoryId}/bookmarks`);
  }

  async createBookmark(
    repositoryId: string,
    request: CreateResourceBookmarkRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${repositoryId}/bookmarks`, request);
  }

  async updateBookmark(
    repositoryId: string,
    bookmarkId: string,
    request: UpdateResourceBookmarkRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO>> {
    return this.httpClient.patch(
      `${this.baseUrl}/${repositoryId}/bookmarks/${bookmarkId}`,
      request,
    );
  }

  async reorderBookmarks(
    repositoryId: string,
    request: ReorderResourceBookmarksRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO[]>> {
    return this.httpClient.post(`${this.baseUrl}/${repositoryId}/bookmarks/reorder`, request);
  }

  async deleteBookmark(repositoryId: string, bookmarkId: string): Promise<Result<void>> {
    return this.httpClient.delete(`${this.baseUrl}/${repositoryId}/bookmarks/${bookmarkId}`);
  }
}

/**
 * Factory function to create RepositoryHttpAdapter
 */
export function createRepositoryHttpAdapter(httpClient: IResultHttpClient): RepositoryHttpAdapter {
  return new RepositoryHttpAdapter(httpClient);
}
