/**
 * Repository API Client Port
 *
 * Transport-agnostic interface for Repository API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * All methods return Result<T> for consistent error handling.
 * Types imported from @dailyuse/contracts/repository.
 */

import type { Result } from '@dailyuse/contracts/result';
import type {
  RepositoryClientDTO,
  FolderClientDTO,
  ResourceClientDTO,
  FileTreeResponse,
  SearchRequest,
  SearchResponse,
  UploadResourcesRequestDTO,
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

// ============ Local Request Types ============

export interface CreateFolderRequest {
  repositoryId: string;
  parentId?: string;
  name: string;
}

export interface CreateResourceRequest {
  name: string;
  type: string;
  mimeType?: string;
  content?: string;
  folderId?: string;
}

export interface UpdateResourceRequest {
  name?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface UploadFileLike {
  name: string;
  type?: string;
  size?: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface UploadResourcesRequest extends UploadResourcesRequestDTO {
  files: Array<UploadFileLike | UploadResourceFileDTO>;
}

// ============ Port Interface ============

/**
 * Repository API Client Interface
 */
export interface IRepositoryApiClient {
  getCurrentRepository(): Promise<Result<RepositoryClientDTO | null>>;

  // ===== Folder Operations =====
  createFolder(request: CreateFolderRequest): Promise<Result<FolderClientDTO>>;
  getFolderContents(folderId: string): Promise<
    Result<{
      folders: FolderClientDTO[];
      resources: ResourceClientDTO[];
    }>
  >;
  renameFolder(id: string, name: string): Promise<Result<FolderClientDTO>>;
  moveFolder(id: string, targetParentId: string): Promise<Result<FolderClientDTO>>;
  deleteFolder(id: string): Promise<Result<void>>;

  // ===== File Tree =====
  getFileTree(repositoryId: string): Promise<Result<FileTreeResponse>>;

  // ===== Search =====
  search(request: SearchRequest): Promise<Result<SearchResponse>>;

  // ===== Resource Operations =====
  listResources(repositoryId: string): Promise<Result<ResourceClientDTO[]>>;
  createResource(
    repositoryId: string,
    request: CreateResourceRequest,
  ): Promise<Result<ResourceClientDTO>>;
  getResource(id: string): Promise<Result<ResourceClientDTO>>;
  updateResource(id: string, request: UpdateResourceRequest): Promise<Result<ResourceClientDTO>>;
  renameResource(id: string, name: string): Promise<Result<ResourceClientDTO>>;
  moveResource(id: string, targetFolderId: string): Promise<Result<ResourceClientDTO>>;
  deleteResource(id: string): Promise<Result<void>>;
  uploadResources(
    repositoryId: string,
    request: UploadResourcesRequest,
  ): Promise<Result<UploadResourcesResponseDTO>>;

  listBookmarks(repositoryId: string): Promise<Result<ResourceBookmarkClientDTO[]>>;
  createBookmark(
    repositoryId: string,
    request: CreateResourceBookmarkRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO>>;
  updateBookmark(
    repositoryId: string,
    bookmarkId: string,
    request: UpdateResourceBookmarkRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO>>;
  reorderBookmarks(
    repositoryId: string,
    request: ReorderResourceBookmarksRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO[]>>;
  deleteBookmark(repositoryId: string, bookmarkId: string): Promise<Result<void>>;

  // ===== GitHub Knowledge Repository Connection =====
  startKnowledgeRepositoryInstallation(
    request?: StartKnowledgeRepositoryInstallationReq,
  ): Promise<Result<StartKnowledgeRepositoryInstallationRes>>;
  completeKnowledgeRepositoryInstallation(
    request: CompleteKnowledgeRepositoryInstallationReq,
  ): Promise<Result<CompleteKnowledgeRepositoryInstallationRes>>;
  listKnowledgeRepositoryConnections(): Promise<Result<ListKnowledgeRepositoryConnectionsRes>>;
  connectKnowledgeRepository(
    request: CreateKnowledgeRepositoryConnectionReq,
  ): Promise<Result<KnowledgeRepositoryConnectionClientDTO>>;
  disconnectKnowledgeRepository(
    connectionId: string,
    purgeCloudData?: boolean,
  ): Promise<Result<DisconnectKnowledgeRepositoryConnectionRes>>;
  previewKnowledgeRepositoryReconciliation(
    connectionId: string,
  ): Promise<Result<KnowledgeRepositoryReconciliationPreview>>;
  executeKnowledgeRepositoryReconciliation(
    request: ExecuteKnowledgeRepositoryReconciliationReq,
  ): Promise<Result<ExecuteKnowledgeRepositoryReconciliationRes>>;
  syncKnowledgeRepository(
    request: SyncKnowledgeRepositoryReq,
  ): Promise<Result<SyncKnowledgeRepositoryRes>>;
  issueDesktopKnowledgeRepositoryToken(
    connectionId: string,
  ): Promise<Result<KnowledgeRepositoryInstallationTokenRes>>;

  // ===== Server-projected GitHub Knowledge Notes =====
  listKnowledgeNoteProjections(
    request?: ListKnowledgeNoteProjectionsReq,
  ): Promise<Result<KnowledgeNoteProjectionListResponse>>;
  getKnowledgeNoteProjection(
    projectionId: string,
  ): Promise<Result<KnowledgeNoteProjectionClientDTO>>;
  getKnowledgeNoteLinkGraph(
    projectionId: string,
    request?: GetKnowledgeNoteLinkGraphReq,
  ): Promise<Result<KnowledgeNoteLinkGraphResponse>>;
  listKnowledgeAttachmentProjections(
    request?: ListKnowledgeAttachmentProjectionsReq,
  ): Promise<Result<KnowledgeAttachmentProjectionListResponse>>;
  getKnowledgeAttachmentContent(
    projectionId: string,
  ): Promise<Result<KnowledgeAttachmentContentResponse>>;
  createConfirmedKnowledgeNote(
    request: CreateConfirmedKnowledgeNoteReq,
  ): Promise<Result<CreateConfirmedKnowledgeNoteResponse>>;

  // ===== Desktop Local Vault =====
  getLocalVaultBinding(): Promise<Result<LocalVaultBindingClientDTO | null>>;
  selectLocalVault(
    request?: SelectLocalVaultReq,
  ): Promise<Result<LocalVaultBindingClientDTO | null>>;
  detachLocalVault(): Promise<Result<void>>;
  scanLocalVault(): Promise<Result<ScanLocalVaultRes>>;
  readLocalVaultNote(request: ReadLocalVaultNoteReq): Promise<Result<ReadLocalVaultNoteRes>>;
  searchLocalVault(request: SearchLocalVaultReq): Promise<Result<SearchLocalVaultRes>>;
  openLocalVaultInObsidian(request: OpenLocalVaultInObsidianReq): Promise<Result<void>>;
  writeConfirmedLocalVaultNote(
    request: ConfirmedLocalVaultWriteReq,
  ): Promise<Result<ConfirmedLocalVaultWriteRes>>;
}
