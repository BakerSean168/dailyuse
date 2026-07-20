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
  UploadFileLike,
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
  UploadResourceFileDTO,
  ResourceBookmarkClientDTO,
  CreateResourceBookmarkRequestDTO,
  UpdateResourceBookmarkRequestDTO,
  ReorderResourceBookmarksRequestDTO,
  LocalVaultBindingClientDTO,
  SelectLocalVaultReq,
  ScanLocalVaultRes,
  ReadLocalVaultNoteReq,
  ReadLocalVaultNoteRes,
  SearchLocalVaultReq,
  SearchLocalVaultRes,
  OpenLocalVaultInObsidianReq,
  ConfirmedLocalVaultWriteReq,
  ConfirmedLocalVaultWriteRes,
  CompleteKnowledgeRepositoryInstallationReq,
  CompleteKnowledgeRepositoryInstallationRes,
  CreateKnowledgeRepositoryConnectionReq,
  KnowledgeRepositoryConnectionClientDTO,
  KnowledgeRepositoryInstallationTokenRes,
  KnowledgeRepositoryReconciliationPreview,
  ListKnowledgeRepositoryConnectionsRes,
  StartKnowledgeRepositoryInstallationReq,
  StartKnowledgeRepositoryInstallationRes,
  DisconnectKnowledgeRepositoryConnectionRes,
  ExecuteKnowledgeRepositoryReconciliationReq,
  ExecuteKnowledgeRepositoryReconciliationRes,
  SyncKnowledgeRepositoryReq,
  SyncKnowledgeRepositoryRes,
  CreateConfirmedKnowledgeNoteReq,
  CreateConfirmedKnowledgeNoteResponse,
  KnowledgeNoteProjectionClientDTO,
  KnowledgeNoteProjectionListResponse,
  ListKnowledgeNoteProjectionsReq,
  GetKnowledgeNoteLinkGraphReq,
  KnowledgeNoteLinkGraphResponse,
  KnowledgeAttachmentContentResponse,
  KnowledgeAttachmentProjectionListResponse,
  ListKnowledgeAttachmentProjectionsReq,
} from '@dailyuse/contracts/repository';
import { fail } from '@dailyuse/contracts/result';

// Local aliases for Web API types not available in non-DOM tsconfig lib
type BlobPart = ArrayBuffer | ArrayBufferView | Blob | string;
interface BlobPropertyBag {
  type?: string;
  endings?: 'transparent' | 'native';
}

/**
 * Type guard to distinguish UploadResourceFileDTO from UploadFileLike.
 */
function isUploadResourceFileDTO(
  file: UploadFileLike | UploadResourceFileDTO,
): file is UploadResourceFileDTO {
  return 'contentBase64' in file;
}

/**
 * Safely access getAxiosInstance from an IResultHttpClient.
 */
function getAxiosInstance(httpClient: IResultHttpClient): unknown | null {
  const client = httpClient as IResultHttpClient & {
    getAxiosInstance?: () => unknown;
  };
  return typeof client.getAxiosInstance === 'function' ? client.getAxiosInstance() : null;
}

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
    return this.httpClient.get(`${this.baseUrl}/${repositoryId}/folders`);
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
    const axios = getAxiosInstance(this.httpClient);
    if (!axios) {
      return fail({
        code: 'INTERNAL_ERROR',
        message: 'HTTP client does not support multipart uploads',
      });
    }

    // Access web API constructors via globalThis — they may not be in scope
    // depending on the runtime environment (Node vs browser).
    const global = globalThis as unknown as {
      FormData?: { new (): FormData };
      Blob?: { new (parts: BlobPart[], options?: BlobPropertyBag): Blob };
    };
    const FormDataCtor = global.FormData;
    const BlobCtor = global.Blob;
    if (!FormDataCtor || !BlobCtor) {
      return fail({
        code: 'INTERNAL_ERROR',
        message: 'Runtime does not support multipart uploads',
      });
    }
    const formData = new FormDataCtor();
    for (const file of request.files) {
      if (isUploadResourceFileDTO(file)) {
        const blob = new BlobCtor([base64ToBytes(file.contentBase64) as unknown as BlobPart], {
          type: file.mimeType || 'application/octet-stream',
        });
        formData.append('files', blob, file.name);
      } else {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const blob = new BlobCtor([bytes as unknown as BlobPart], {
          type: file.type || 'application/octet-stream',
        });
        formData.append('files', blob, file.name);
      }
    }
    if (request.folderId) formData.append('folderId', request.folderId);
    if (request.tags) formData.append('tags', JSON.stringify(request.tags));
    if (request.overwritePolicy) formData.append('overwritePolicy', request.overwritePolicy);

    const client = this.httpClient as IResultHttpClient & {
      request: (config: unknown) => Promise<Result<UploadResourcesResponseDTO>>;
    };
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

  async startKnowledgeRepositoryInstallation(
    request: StartKnowledgeRepositoryInstallationReq = {},
  ): Promise<Result<StartKnowledgeRepositoryInstallationRes>> {
    return this.httpClient.post(
      `${this.baseUrl}/knowledge-connections/installations/start`,
      request,
    );
  }

  async completeKnowledgeRepositoryInstallation(
    request: CompleteKnowledgeRepositoryInstallationReq,
  ): Promise<Result<CompleteKnowledgeRepositoryInstallationRes>> {
    return this.httpClient.post(
      `${this.baseUrl}/knowledge-connections/installations/complete`,
      request,
    );
  }

  async listKnowledgeRepositoryConnections(): Promise<
    Result<ListKnowledgeRepositoryConnectionsRes>
  > {
    return this.httpClient.get(`${this.baseUrl}/knowledge-connections`);
  }

  async connectKnowledgeRepository(
    request: CreateKnowledgeRepositoryConnectionReq,
  ): Promise<Result<KnowledgeRepositoryConnectionClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/knowledge-connections`, request);
  }

  async disconnectKnowledgeRepository(
    connectionId: string,
    purgeCloudData = false,
  ): Promise<Result<DisconnectKnowledgeRepositoryConnectionRes>> {
    return this.httpClient.delete(
      `${this.baseUrl}/knowledge-connections/${encodeURIComponent(connectionId)}`,
      { params: { purgeCloudData } },
    );
  }

  async previewKnowledgeRepositoryReconciliation(
    _connectionId: string,
  ): Promise<Result<KnowledgeRepositoryReconciliationPreview>> {
    return this.localVaultUnavailable();
  }

  async executeKnowledgeRepositoryReconciliation(
    _request: ExecuteKnowledgeRepositoryReconciliationReq,
  ): Promise<Result<ExecuteKnowledgeRepositoryReconciliationRes>> {
    return this.localVaultUnavailable();
  }

  async syncKnowledgeRepository(
    _request: SyncKnowledgeRepositoryReq,
  ): Promise<Result<SyncKnowledgeRepositoryRes>> {
    return this.localVaultUnavailable();
  }

  async issueDesktopKnowledgeRepositoryToken(
    connectionId: string,
  ): Promise<Result<KnowledgeRepositoryInstallationTokenRes>> {
    return this.httpClient.post(
      `${this.baseUrl}/knowledge-connections/${encodeURIComponent(connectionId)}/desktop-token`,
    );
  }

  async listKnowledgeNoteProjections(
    request: ListKnowledgeNoteProjectionsReq = { limit: 50 },
  ): Promise<Result<KnowledgeNoteProjectionListResponse>> {
    return this.httpClient.get(`${this.baseUrl}/knowledge-notes`, {
      params: {
        ...(request.connectionId ? { connectionId: request.connectionId } : {}),
        ...(request.query ? { query: request.query } : {}),
        limit: request.limit,
      },
    });
  }

  async getKnowledgeNoteProjection(
    projectionId: string,
  ): Promise<Result<KnowledgeNoteProjectionClientDTO>> {
    return this.httpClient.get(
      `${this.baseUrl}/knowledge-notes/${encodeURIComponent(projectionId)}`,
    );
  }

  async getKnowledgeNoteLinkGraph(
    projectionId: string,
    request: GetKnowledgeNoteLinkGraphReq = { depth: 1, maxNodes: 40 },
  ): Promise<Result<KnowledgeNoteLinkGraphResponse>> {
    return this.httpClient.get(
      `${this.baseUrl}/knowledge-notes/${encodeURIComponent(projectionId)}/link-graph`,
      { params: request },
    );
  }

  async listKnowledgeAttachmentProjections(
    request: ListKnowledgeAttachmentProjectionsReq = { limit: 50 },
  ): Promise<Result<KnowledgeAttachmentProjectionListResponse>> {
    return this.httpClient.get(`${this.baseUrl}/knowledge-attachments`, {
      params: {
        ...(request.connectionId ? { connectionId: request.connectionId } : {}),
        ...(request.query ? { query: request.query } : {}),
        limit: request.limit,
      },
    });
  }

  async getKnowledgeAttachmentContent(
    projectionId: string,
  ): Promise<Result<KnowledgeAttachmentContentResponse>> {
    return this.httpClient.get(
      `${this.baseUrl}/knowledge-attachments/${encodeURIComponent(projectionId)}/content`,
    );
  }

  async createConfirmedKnowledgeNote(
    request: CreateConfirmedKnowledgeNoteReq,
  ): Promise<Result<CreateConfirmedKnowledgeNoteResponse>> {
    return this.httpClient.post(`${this.baseUrl}/knowledge-notes`, request);
  }

  private localVaultUnavailable<T>(): Result<T> {
    return fail({
      code: 'SERVICE_UNAVAILABLE',
      message: 'Local Vault is only available in the Desktop runtime',
    });
  }

  async getLocalVaultBinding(): Promise<Result<LocalVaultBindingClientDTO | null>> {
    return this.localVaultUnavailable();
  }

  async selectLocalVault(
    _request: SelectLocalVaultReq = {},
  ): Promise<Result<LocalVaultBindingClientDTO | null>> {
    return this.localVaultUnavailable();
  }

  async detachLocalVault(): Promise<Result<void>> {
    return this.localVaultUnavailable();
  }

  async scanLocalVault(): Promise<Result<ScanLocalVaultRes>> {
    return this.localVaultUnavailable();
  }

  async readLocalVaultNote(
    _request: ReadLocalVaultNoteReq,
  ): Promise<Result<ReadLocalVaultNoteRes>> {
    return this.localVaultUnavailable();
  }

  async searchLocalVault(_request: SearchLocalVaultReq): Promise<Result<SearchLocalVaultRes>> {
    return this.localVaultUnavailable();
  }

  async openLocalVaultInObsidian(_request: OpenLocalVaultInObsidianReq): Promise<Result<void>> {
    return this.localVaultUnavailable();
  }

  async writeConfirmedLocalVaultNote(
    _request: ConfirmedLocalVaultWriteReq,
  ): Promise<Result<ConfirmedLocalVaultWriteRes>> {
    return this.localVaultUnavailable();
  }
}

/**
 * Factory function to create RepositoryHttpAdapter
 */
export function createRepositoryHttpAdapter(httpClient: IResultHttpClient): RepositoryHttpAdapter {
  return new RepositoryHttpAdapter(httpClient);
}
