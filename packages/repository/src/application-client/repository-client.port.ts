import type { Result } from '@dailyuse/contracts/result';
import type {
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
import type {
  CreateFolderRequest,
  CreateResourceRequest,
  UpdateResourceRequest,
  UploadResourcesRequest,
} from './ports/repository-api-client.port';
import type { Repository } from '../domain-client/aggregates/repository';

export interface RepositoryClientPort {
  getCurrentRepository(): Promise<Result<Repository | null>>;

  // Folder Operations
  createFolder(request: CreateFolderRequest): Promise<Result<FolderClientDTO>>;
  getFolderContents(
    folderId: string,
  ): Promise<Result<{ folders: FolderClientDTO[]; resources: ResourceClientDTO[] }>>;
  renameFolder(id: string, name: string): Promise<Result<FolderClientDTO>>;
  moveFolder(id: string, targetParentId: string): Promise<Result<FolderClientDTO>>;
  deleteFolder(id: string): Promise<Result<void>>;

  // File Tree
  getFileTree(repositoryId: string): Promise<Result<FileTreeResponse>>;

  // Search
  search(request: SearchRequest): Promise<Result<SearchResponse>>;

  // Resource Operations
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

  // Bookmarks
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

  // GitHub knowledge repository authorization (separate from login OAuth)
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

  // Server-projected GitHub knowledge notes
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

  // Desktop Local Vault (HTTP implementations return SERVICE_UNAVAILABLE)
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
