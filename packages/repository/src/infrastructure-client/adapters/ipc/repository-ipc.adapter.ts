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

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  return Buffer.from(bytes).toString('base64');
}

/**
 * Repository IPC Adapter
 *
 * Implements IRepositoryApiClient using Electron IPC.
 */
export class RepositoryIpcAdapter implements IRepositoryApiClient {
  private readonly channel = 'repository';

  constructor(private readonly ipcClient: IResultIpcClient) {}

  async getCurrentRepository(): Promise<Result<RepositoryClientDTO | null>> {
    return this.ipcClient.invoke(`${this.channel}:current`);
  }

  // ===== Folder Operations =====

  async createFolder(request: CreateFolderRequest): Promise<Result<FolderClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:folder:create`, request);
  }

  async getFolderContents(folderId: string): Promise<
    Result<{
      folders: FolderClientDTO[];
      resources: ResourceClientDTO[];
    }>
  > {
    return this.ipcClient.invoke(`${this.channel}:folder:list`, { folderId });
  }

  async renameFolder(id: string, name: string): Promise<Result<FolderClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:folder:update`, { id, name });
  }

  async moveFolder(id: string, targetParentId: string): Promise<Result<FolderClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:folder:update`, { id, parentId: targetParentId });
  }

  async deleteFolder(id: string): Promise<Result<void>> {
    return this.ipcClient.invoke(`${this.channel}:folder:delete`, id);
  }

  // ===== File Tree =====

  async getFileTree(repositoryId: string): Promise<Result<FileTreeResponse>> {
    return this.ipcClient.invoke(`${this.channel}:folder:list`, { repositoryId });
  }

  // ===== Search =====

  async search(request: SearchRequest): Promise<Result<SearchResponse>> {
    return this.ipcClient.invoke(`${this.channel}:search`, request);
  }

  // ===== Resource Operations =====

  async listResources(repositoryId: string): Promise<Result<ResourceClientDTO[]>> {
    return this.ipcClient.invoke(`${this.channel}:resource:list`, repositoryId);
  }

  async createResource(
    repositoryId: string,
    request: CreateResourceRequest,
  ): Promise<Result<ResourceClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:resource:create`, { repositoryId, ...request });
  }

  async getResource(id: string): Promise<Result<ResourceClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:resource:get`, id);
  }

  async updateResource(
    id: string,
    request: UpdateResourceRequest,
  ): Promise<Result<ResourceClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:resource:update`, { id, ...request });
  }

  async renameResource(id: string, name: string): Promise<Result<ResourceClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:resource:update`, { id, name });
  }

  async moveResource(id: string, targetFolderId: string): Promise<Result<ResourceClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:resource:update`, { id, targetFolderId });
  }

  async deleteResource(id: string): Promise<Result<void>> {
    return this.ipcClient.invoke(`${this.channel}:resource:delete`, id);
  }

  async uploadResources(
    repositoryId: string,
    request: UploadResourcesRequest,
  ): Promise<Result<UploadResourcesResponseDTO>> {
    const files = await Promise.all(
      request.files.map(async (file) => {
        if (typeof File !== 'undefined' && file instanceof File) {
          const buffer = new Uint8Array(await file.arrayBuffer());
          return {
            name: file.name,
            mimeType: file.type,
            size: file.size,
            contentBase64: bytesToBase64(buffer),
          };
        }
        return file;
      }),
    );

    return this.ipcClient.invoke(`${this.channel}:resource:upload`, {
      repositoryId,
      files,
      metadata: {
        folderId: request.folderId,
        tags: request.tags,
        overwritePolicy: request.overwritePolicy,
      },
    });
  }

  async listBookmarks(repositoryId: string): Promise<Result<ResourceBookmarkClientDTO[]>> {
    return this.ipcClient.invoke(`${this.channel}:bookmark:list`, { repositoryId });
  }

  async createBookmark(
    repositoryId: string,
    request: CreateResourceBookmarkRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:bookmark:create`, { repositoryId, request });
  }

  async updateBookmark(
    repositoryId: string,
    bookmarkId: string,
    request: UpdateResourceBookmarkRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:bookmark:update`, {
      repositoryId,
      bookmarkId,
      request,
    });
  }

  async reorderBookmarks(
    repositoryId: string,
    request: ReorderResourceBookmarksRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO[]>> {
    return this.ipcClient.invoke(`${this.channel}:bookmark:reorder`, { repositoryId, request });
  }

  async deleteBookmark(repositoryId: string, bookmarkId: string): Promise<Result<void>> {
    return this.ipcClient.invoke(`${this.channel}:bookmark:delete`, { repositoryId, bookmarkId });
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
