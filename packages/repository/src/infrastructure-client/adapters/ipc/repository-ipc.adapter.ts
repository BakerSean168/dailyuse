/**
 * Repository IPC Adapter
 *
 * IPC implementation of IRepositoryApiClient for Electron desktop app.
 * Uses tryCatch for consistent Result<T> error handling.
 */

import { fail, type Result } from '@dailyuse/contracts/result';
import type {
  IResultIpcClient,
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
 * Repository IPC Adapter
 *
 * Implements IRepositoryApiClient using Electron IPC.
 */
export class RepositoryIpcAdapter implements IRepositoryApiClient {
  private readonly channel = 'repository';

  constructor(private readonly ipcClient: IResultIpcClient) {}

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
    return this.ipcClient.invoke(
      `${this.channel}:knowledge-connection:installation:start`,
      request,
    );
  }

  async completeKnowledgeRepositoryInstallation(
    request: CompleteKnowledgeRepositoryInstallationReq,
  ): Promise<Result<CompleteKnowledgeRepositoryInstallationRes>> {
    return this.ipcClient.invoke(
      `${this.channel}:knowledge-connection:installation:complete`,
      request,
    );
  }

  async listKnowledgeRepositoryConnections(): Promise<
    Result<ListKnowledgeRepositoryConnectionsRes>
  > {
    return this.ipcClient.invoke(`${this.channel}:knowledge-connection:list`);
  }

  async connectKnowledgeRepository(
    request: CreateKnowledgeRepositoryConnectionReq,
  ): Promise<Result<KnowledgeRepositoryConnectionClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:knowledge-connection:connect`, request);
  }

  async disconnectKnowledgeRepository(
    connectionId: string,
    purgeCloudData = false,
  ): Promise<Result<DisconnectKnowledgeRepositoryConnectionRes>> {
    return this.ipcClient.invoke(`${this.channel}:knowledge-connection:disconnect`, {
      connectionId,
      purgeCloudData,
    });
  }

  async previewKnowledgeRepositoryReconciliation(
    connectionId: string,
  ): Promise<Result<KnowledgeRepositoryReconciliationPreview>> {
    return this.ipcClient.invoke(`${this.channel}:knowledge-connection:reconciliation-preview`, {
      connectionId,
    });
  }

  async executeKnowledgeRepositoryReconciliation(
    request: ExecuteKnowledgeRepositoryReconciliationReq,
  ): Promise<Result<ExecuteKnowledgeRepositoryReconciliationRes>> {
    return this.ipcClient.invoke(
      `${this.channel}:knowledge-connection:reconciliation-execute`,
      request,
    );
  }

  async syncKnowledgeRepository(
    request: SyncKnowledgeRepositoryReq,
  ): Promise<Result<SyncKnowledgeRepositoryRes>> {
    return this.ipcClient.invoke(`${this.channel}:knowledge-connection:sync`, request);
  }

  async issueDesktopKnowledgeRepositoryToken(
    connectionId: string,
  ): Promise<Result<KnowledgeRepositoryInstallationTokenRes>> {
    return this.ipcClient.invoke(`${this.channel}:knowledge-connection:desktop-token`, {
      connectionId,
    });
  }

  async listKnowledgeNoteProjections(
    _request: ListKnowledgeNoteProjectionsReq = { limit: 50 },
  ): Promise<Result<KnowledgeNoteProjectionListResponse>> {
    return this.serverProjectionUnavailable();
  }

  async getKnowledgeNoteProjection(
    _projectionId: string,
  ): Promise<Result<KnowledgeNoteProjectionClientDTO>> {
    return this.serverProjectionUnavailable();
  }

  async getKnowledgeNoteLinkGraph(
    _projectionId: string,
    _request: GetKnowledgeNoteLinkGraphReq = { depth: 1, maxNodes: 40 },
  ): Promise<Result<KnowledgeNoteLinkGraphResponse>> {
    return this.serverProjectionUnavailable();
  }

  async listKnowledgeAttachmentProjections(
    _request: ListKnowledgeAttachmentProjectionsReq = { limit: 50 },
  ): Promise<Result<KnowledgeAttachmentProjectionListResponse>> {
    return this.serverProjectionUnavailable();
  }

  async getKnowledgeAttachmentContent(
    _projectionId: string,
  ): Promise<Result<KnowledgeAttachmentContentResponse>> {
    return this.serverProjectionUnavailable();
  }

  async createConfirmedKnowledgeNote(
    _request: CreateConfirmedKnowledgeNoteReq,
  ): Promise<Result<CreateConfirmedKnowledgeNoteResponse>> {
    return this.serverProjectionUnavailable();
  }

  async getLocalVaultBinding(): Promise<Result<LocalVaultBindingClientDTO | null>> {
    return this.ipcClient.invoke(`${this.channel}:local-vault:get`);
  }

  async selectLocalVault(
    request: SelectLocalVaultReq = {},
  ): Promise<Result<LocalVaultBindingClientDTO | null>> {
    return this.ipcClient.invoke(`${this.channel}:local-vault:select`, request);
  }

  async detachLocalVault(): Promise<Result<void>> {
    return this.ipcClient.invoke(`${this.channel}:local-vault:detach`);
  }

  async scanLocalVault(): Promise<Result<ScanLocalVaultRes>> {
    return this.ipcClient.invoke(`${this.channel}:local-vault:scan`);
  }

  async readLocalVaultNote(request: ReadLocalVaultNoteReq): Promise<Result<ReadLocalVaultNoteRes>> {
    return this.ipcClient.invoke(`${this.channel}:local-vault:note:read`, request);
  }

  async searchLocalVault(request: SearchLocalVaultReq): Promise<Result<SearchLocalVaultRes>> {
    return this.ipcClient.invoke(`${this.channel}:local-vault:search`, request);
  }

  async openLocalVaultInObsidian(request: OpenLocalVaultInObsidianReq): Promise<Result<void>> {
    return this.ipcClient.invoke(`${this.channel}:local-vault:open-obsidian`, request);
  }

  async writeConfirmedLocalVaultNote(
    request: ConfirmedLocalVaultWriteReq,
  ): Promise<Result<ConfirmedLocalVaultWriteRes>> {
    return this.ipcClient.invoke(`${this.channel}:local-vault:note:write-confirmed`, request);
  }


  private legacyDatabaseRepositoryUnavailable<T>(): Result<T> {
    return fail({
      code: 'NOT_SUPPORTED',
      message:
        'Legacy database Repository/Folder/Resource APIs were removed; use Local Vault or GitHub knowledge projections',
    });
  }

  private serverProjectionUnavailable<T>(): Result<T> {
    return fail({
      code: 'SERVICE_UNAVAILABLE',
      message: 'GitHub knowledge-note projections are available through the Web API only',
    });
  }
}

export function createRepositoryIpcAdapter(ipcClient: IResultIpcClient): RepositoryIpcAdapter {
  return new RepositoryIpcAdapter(ipcClient);
}
