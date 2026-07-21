/**
 * Repository HTTP Adapter
 *
 * HTTP implementation of IRepositoryApiClient.
 * Uses IResultHttpClient for making HTTP requests.
 */

import { fail, type Result } from '@dailyuse/contracts/result';
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


/**
 * Repository HTTP Adapter
 *
 * Implements IRepositoryApiClient using HTTP REST API calls.
 */
export class RepositoryHttpAdapter implements IRepositoryApiClient {
  private readonly baseUrl = '/repositories';

  constructor(private readonly httpClient: IResultHttpClient) {}

  async getCurrentRepository(): Promise<Result<RepositoryClientDTO | null>> {
    return this.legacyDatabaseRepositoryUnavailable();
  }

  // ===== Folder / Resource / Bookmark (removed runtime surface) =====

  async createFolder(_request: CreateFolderRequest): Promise<Result<FolderClientDTO>> {
    return this.legacyDatabaseRepositoryUnavailable();
  }

  async getFolderContents(_folderId: string): Promise<
    Result<{
      folders: FolderClientDTO[];
      resources: ResourceClientDTO[];
    }>
  > {
    return this.legacyDatabaseRepositoryUnavailable();
  }

  async renameFolder(_id: string, _name: string): Promise<Result<FolderClientDTO>> {
    return this.legacyDatabaseRepositoryUnavailable();
  }

  async moveFolder(_id: string, _targetParentId: string): Promise<Result<FolderClientDTO>> {
    return this.legacyDatabaseRepositoryUnavailable();
  }

  async deleteFolder(_id: string): Promise<Result<void>> {
    return this.legacyDatabaseRepositoryUnavailable();
  }

  async getFileTree(_repositoryId: string): Promise<Result<FileTreeResponse>> {
    return this.legacyDatabaseRepositoryUnavailable();
  }

  async search(_request: SearchRequest): Promise<Result<SearchResponse>> {
    return this.legacyDatabaseRepositoryUnavailable();
  }

  async listResources(_repositoryId: string): Promise<Result<ResourceClientDTO[]>> {
    return this.legacyDatabaseRepositoryUnavailable();
  }

  async createResource(
    _repositoryId: string,
    _request: CreateResourceRequest,
  ): Promise<Result<ResourceClientDTO>> {
    return this.legacyDatabaseRepositoryUnavailable();
  }

  async getResource(_id: string): Promise<Result<ResourceClientDTO>> {
    return this.legacyDatabaseRepositoryUnavailable();
  }

  async updateResource(
    _id: string,
    _request: UpdateResourceRequest,
  ): Promise<Result<ResourceClientDTO>> {
    return this.legacyDatabaseRepositoryUnavailable();
  }

  async renameResource(_id: string, _name: string): Promise<Result<ResourceClientDTO>> {
    return this.legacyDatabaseRepositoryUnavailable();
  }

  async moveResource(_id: string, _targetFolderId: string): Promise<Result<ResourceClientDTO>> {
    return this.legacyDatabaseRepositoryUnavailable();
  }

  async deleteResource(_id: string): Promise<Result<void>> {
    return this.legacyDatabaseRepositoryUnavailable();
  }

  async uploadResources(
    _repositoryId: string,
    _request: UploadResourcesRequest,
  ): Promise<Result<UploadResourcesResponseDTO>> {
    return this.legacyDatabaseRepositoryUnavailable();
  }

  async listBookmarks(_repositoryId: string): Promise<Result<ResourceBookmarkClientDTO[]>> {
    return this.legacyDatabaseRepositoryUnavailable();
  }

  async createBookmark(
    _repositoryId: string,
    _request: CreateResourceBookmarkRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO>> {
    return this.legacyDatabaseRepositoryUnavailable();
  }

  async updateBookmark(
    _repositoryId: string,
    _bookmarkId: string,
    _request: UpdateResourceBookmarkRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO>> {
    return this.legacyDatabaseRepositoryUnavailable();
  }

  async reorderBookmarks(
    _repositoryId: string,
    _request: ReorderResourceBookmarksRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO[]>> {
    return this.legacyDatabaseRepositoryUnavailable();
  }

  async deleteBookmark(_repositoryId: string, _bookmarkId: string): Promise<Result<void>> {
    return this.legacyDatabaseRepositoryUnavailable();
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


  private legacyDatabaseRepositoryUnavailable<T>(): Result<T> {
    return fail({
      code: 'NOT_SUPPORTED',
      message:
        'Legacy database Repository/Folder/Resource APIs were removed; use Local Vault or GitHub knowledge projections',
    });
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
