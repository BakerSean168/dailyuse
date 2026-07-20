/**
 * Repository Client Service
 *
 * Constructor-injected application service for repository management.
 * Uses port interfaces directly, returning Result<T> types throughout.
 *
 * @module application-client/repository-client-service
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail, ok } from '@dailyuse/contracts/result';
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
import type {
  IRepositoryApiClient,
  CreateFolderRequest,
  CreateResourceRequest,
  UpdateResourceRequest,
  UploadResourcesRequest,
} from './ports/repository-api-client.port';
import { Repository } from '../domain-client/aggregates/repository';
import { RepositoryId } from '../server/domain/value-objects/repository-id';
import { RepositoryConfig } from '../server/domain/value-objects/repository-config';
import { RepositoryStats } from '../server/domain/value-objects/repository-stats';
import { IdentityId } from '@dailyuse/domain-shared';

// ===== DTO-to-State Mapper =====

function validateRepositoryDTO(dto: RepositoryClientDTO): Result<RepositoryClientDTO> {
  if (typeof dto.id !== 'string') {
    return fail({
      code: 'INVALID_RESPONSE',
      message: 'Invalid RepositoryClientDTO: id must be a string',
    });
  }

  if (typeof dto.identityId !== 'string') {
    return fail({
      code: 'INVALID_RESPONSE',
      message: 'Invalid RepositoryClientDTO: identityId must be a string',
    });
  }

  return ok(dto);
}

function repositoryFromDTO(dto: RepositoryClientDTO): Result<Repository> {
  const validation = validateRepositoryDTO(dto);
  if (!validation.ok) {
    return validation;
  }

  return ok(
    Repository.load({
      id: RepositoryId.of(dto.id),
      identityId: IdentityId.of(dto.identityId),
      name: dto.name,
      type: dto.type,
      path: dto.path,
      description: dto.description,
      config: RepositoryConfig.fromDTO(dto.config),
      stats: RepositoryStats.fromDTO(dto.stats),
      status: dto.status,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    }),
  );
}

import type { RepositoryClientPort } from './repository-client.port';

export class RepositoryClientService implements RepositoryClientPort {
  constructor(private readonly repositoryApi: IRepositoryApiClient) {
    this.getCurrentRepository = this.getCurrentRepository.bind(this);
    this.createFolder = this.createFolder.bind(this);
    this.getFolderContents = this.getFolderContents.bind(this);
    this.renameFolder = this.renameFolder.bind(this);
    this.moveFolder = this.moveFolder.bind(this);
    this.deleteFolder = this.deleteFolder.bind(this);
    this.getFileTree = this.getFileTree.bind(this);
    this.search = this.search.bind(this);
    this.listResources = this.listResources.bind(this);
    this.createResource = this.createResource.bind(this);
    this.getResource = this.getResource.bind(this);
    this.updateResource = this.updateResource.bind(this);
    this.renameResource = this.renameResource.bind(this);
    this.moveResource = this.moveResource.bind(this);
    this.deleteResource = this.deleteResource.bind(this);
    this.uploadResources = this.uploadResources.bind(this);
    this.listBookmarks = this.listBookmarks.bind(this);
    this.createBookmark = this.createBookmark.bind(this);
    this.updateBookmark = this.updateBookmark.bind(this);
    this.reorderBookmarks = this.reorderBookmarks.bind(this);
    this.deleteBookmark = this.deleteBookmark.bind(this);
    this.startKnowledgeRepositoryInstallation =
      this.startKnowledgeRepositoryInstallation.bind(this);
    this.completeKnowledgeRepositoryInstallation =
      this.completeKnowledgeRepositoryInstallation.bind(this);
    this.listKnowledgeRepositoryConnections = this.listKnowledgeRepositoryConnections.bind(this);
    this.connectKnowledgeRepository = this.connectKnowledgeRepository.bind(this);
    this.disconnectKnowledgeRepository = this.disconnectKnowledgeRepository.bind(this);
    this.previewKnowledgeRepositoryReconciliation =
      this.previewKnowledgeRepositoryReconciliation.bind(this);
    this.executeKnowledgeRepositoryReconciliation =
      this.executeKnowledgeRepositoryReconciliation.bind(this);
    this.syncKnowledgeRepository = this.syncKnowledgeRepository.bind(this);
    this.issueDesktopKnowledgeRepositoryToken =
      this.issueDesktopKnowledgeRepositoryToken.bind(this);
    this.listKnowledgeNoteProjections = this.listKnowledgeNoteProjections.bind(this);
    this.getKnowledgeNoteProjection = this.getKnowledgeNoteProjection.bind(this);
    this.getKnowledgeNoteLinkGraph = this.getKnowledgeNoteLinkGraph.bind(this);
    this.listKnowledgeAttachmentProjections = this.listKnowledgeAttachmentProjections.bind(this);
    this.getKnowledgeAttachmentContent = this.getKnowledgeAttachmentContent.bind(this);
    this.createConfirmedKnowledgeNote = this.createConfirmedKnowledgeNote.bind(this);
    this.getLocalVaultBinding = this.getLocalVaultBinding.bind(this);
    this.selectLocalVault = this.selectLocalVault.bind(this);
    this.detachLocalVault = this.detachLocalVault.bind(this);
    this.scanLocalVault = this.scanLocalVault.bind(this);
    this.readLocalVaultNote = this.readLocalVaultNote.bind(this);
    this.searchLocalVault = this.searchLocalVault.bind(this);
    this.openLocalVaultInObsidian = this.openLocalVaultInObsidian.bind(this);
    this.writeConfirmedLocalVaultNote = this.writeConfirmedLocalVaultNote.bind(this);
  }

  async getCurrentRepository(): Promise<Result<Repository | null>> {
    const result = await this.repositoryApi.getCurrentRepository();
    if (!result.ok) {
      return result;
    }

    if (result.data === null) {
      return ok(null, result.meta);
    }

    const mapped = repositoryFromDTO(result.data);
    return mapped.ok ? ok(mapped.data, result.meta) : mapped;
  }

  // ===== Folder Operations =====

  async createFolder(request: CreateFolderRequest): Promise<Result<FolderClientDTO>> {
    return this.repositoryApi.createFolder(request);
  }

  async getFolderContents(folderId: string): Promise<
    Result<{
      folders: FolderClientDTO[];
      resources: ResourceClientDTO[];
    }>
  > {
    return this.repositoryApi.getFolderContents(folderId);
  }

  async renameFolder(id: string, name: string): Promise<Result<FolderClientDTO>> {
    return this.repositoryApi.renameFolder(id, name);
  }

  async moveFolder(id: string, targetParentId: string): Promise<Result<FolderClientDTO>> {
    return this.repositoryApi.moveFolder(id, targetParentId);
  }

  async deleteFolder(id: string): Promise<Result<void>> {
    return this.repositoryApi.deleteFolder(id);
  }

  // ===== File Tree =====

  async getFileTree(repositoryId: string): Promise<Result<FileTreeResponse>> {
    return this.repositoryApi.getFileTree(repositoryId);
  }

  // ===== Search =====

  async search(request: SearchRequest): Promise<Result<SearchResponse>> {
    return this.repositoryApi.search(request);
  }

  // ===== Resource Operations =====

  async listResources(repositoryId: string): Promise<Result<ResourceClientDTO[]>> {
    return this.repositoryApi.listResources(repositoryId);
  }

  async createResource(
    repositoryId: string,
    request: CreateResourceRequest,
  ): Promise<Result<ResourceClientDTO>> {
    return this.repositoryApi.createResource(repositoryId, request);
  }

  async getResource(id: string): Promise<Result<ResourceClientDTO>> {
    return this.repositoryApi.getResource(id);
  }

  async updateResource(
    id: string,
    request: UpdateResourceRequest,
  ): Promise<Result<ResourceClientDTO>> {
    return this.repositoryApi.updateResource(id, request);
  }

  async renameResource(id: string, name: string): Promise<Result<ResourceClientDTO>> {
    return this.repositoryApi.renameResource(id, name);
  }

  async moveResource(id: string, targetFolderId: string): Promise<Result<ResourceClientDTO>> {
    return this.repositoryApi.moveResource(id, targetFolderId);
  }

  async deleteResource(id: string): Promise<Result<void>> {
    return this.repositoryApi.deleteResource(id);
  }

  async uploadResources(
    repositoryId: string,
    request: UploadResourcesRequest,
  ): Promise<Result<UploadResourcesResponseDTO>> {
    return this.repositoryApi.uploadResources(repositoryId, request);
  }

  async listBookmarks(repositoryId: string): Promise<Result<ResourceBookmarkClientDTO[]>> {
    return this.repositoryApi.listBookmarks(repositoryId);
  }

  async createBookmark(
    repositoryId: string,
    request: CreateResourceBookmarkRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO>> {
    return this.repositoryApi.createBookmark(repositoryId, request);
  }

  async updateBookmark(
    repositoryId: string,
    bookmarkId: string,
    request: UpdateResourceBookmarkRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO>> {
    return this.repositoryApi.updateBookmark(repositoryId, bookmarkId, request);
  }

  async reorderBookmarks(
    repositoryId: string,
    request: ReorderResourceBookmarksRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO[]>> {
    return this.repositoryApi.reorderBookmarks(repositoryId, request);
  }

  async deleteBookmark(repositoryId: string, bookmarkId: string): Promise<Result<void>> {
    return this.repositoryApi.deleteBookmark(repositoryId, bookmarkId);
  }

  async startKnowledgeRepositoryInstallation(
    request: StartKnowledgeRepositoryInstallationReq = {},
  ): Promise<Result<StartKnowledgeRepositoryInstallationRes>> {
    return this.repositoryApi.startKnowledgeRepositoryInstallation(request);
  }

  async completeKnowledgeRepositoryInstallation(
    request: CompleteKnowledgeRepositoryInstallationReq,
  ): Promise<Result<CompleteKnowledgeRepositoryInstallationRes>> {
    return this.repositoryApi.completeKnowledgeRepositoryInstallation(request);
  }

  async listKnowledgeRepositoryConnections(): Promise<
    Result<ListKnowledgeRepositoryConnectionsRes>
  > {
    return this.repositoryApi.listKnowledgeRepositoryConnections();
  }

  async connectKnowledgeRepository(
    request: CreateKnowledgeRepositoryConnectionReq,
  ): Promise<Result<KnowledgeRepositoryConnectionClientDTO>> {
    return this.repositoryApi.connectKnowledgeRepository(request);
  }

  async disconnectKnowledgeRepository(
    connectionId: string,
    purgeCloudData = false,
  ): Promise<Result<DisconnectKnowledgeRepositoryConnectionRes>> {
    return this.repositoryApi.disconnectKnowledgeRepository(connectionId, purgeCloudData);
  }

  async previewKnowledgeRepositoryReconciliation(
    connectionId: string,
  ): Promise<Result<KnowledgeRepositoryReconciliationPreview>> {
    return this.repositoryApi.previewKnowledgeRepositoryReconciliation(connectionId);
  }

  async executeKnowledgeRepositoryReconciliation(
    request: ExecuteKnowledgeRepositoryReconciliationReq,
  ): Promise<Result<ExecuteKnowledgeRepositoryReconciliationRes>> {
    return this.repositoryApi.executeKnowledgeRepositoryReconciliation(request);
  }

  async syncKnowledgeRepository(
    request: SyncKnowledgeRepositoryReq,
  ): Promise<Result<SyncKnowledgeRepositoryRes>> {
    return this.repositoryApi.syncKnowledgeRepository(request);
  }

  async issueDesktopKnowledgeRepositoryToken(
    connectionId: string,
  ): Promise<Result<KnowledgeRepositoryInstallationTokenRes>> {
    return this.repositoryApi.issueDesktopKnowledgeRepositoryToken(connectionId);
  }

  async listKnowledgeNoteProjections(
    request: ListKnowledgeNoteProjectionsReq = { limit: 50 },
  ): Promise<Result<KnowledgeNoteProjectionListResponse>> {
    return this.repositoryApi.listKnowledgeNoteProjections(request);
  }

  async getKnowledgeNoteProjection(
    projectionId: string,
  ): Promise<Result<KnowledgeNoteProjectionClientDTO>> {
    return this.repositoryApi.getKnowledgeNoteProjection(projectionId);
  }

  async getKnowledgeNoteLinkGraph(
    projectionId: string,
    request: GetKnowledgeNoteLinkGraphReq = { depth: 1, maxNodes: 40 },
  ): Promise<Result<KnowledgeNoteLinkGraphResponse>> {
    return this.repositoryApi.getKnowledgeNoteLinkGraph(projectionId, request);
  }

  async listKnowledgeAttachmentProjections(
    request: ListKnowledgeAttachmentProjectionsReq = { limit: 50 },
  ): Promise<Result<KnowledgeAttachmentProjectionListResponse>> {
    return this.repositoryApi.listKnowledgeAttachmentProjections(request);
  }

  async getKnowledgeAttachmentContent(
    projectionId: string,
  ): Promise<Result<KnowledgeAttachmentContentResponse>> {
    return this.repositoryApi.getKnowledgeAttachmentContent(projectionId);
  }

  async createConfirmedKnowledgeNote(
    request: CreateConfirmedKnowledgeNoteReq,
  ): Promise<Result<CreateConfirmedKnowledgeNoteResponse>> {
    return this.repositoryApi.createConfirmedKnowledgeNote(request);
  }

  async getLocalVaultBinding(): Promise<Result<LocalVaultBindingClientDTO | null>> {
    return this.repositoryApi.getLocalVaultBinding();
  }

  async selectLocalVault(
    request?: SelectLocalVaultReq,
  ): Promise<Result<LocalVaultBindingClientDTO | null>> {
    return this.repositoryApi.selectLocalVault(request);
  }

  async detachLocalVault(): Promise<Result<void>> {
    return this.repositoryApi.detachLocalVault();
  }

  async scanLocalVault(): Promise<Result<ScanLocalVaultRes>> {
    return this.repositoryApi.scanLocalVault();
  }

  async readLocalVaultNote(request: ReadLocalVaultNoteReq): Promise<Result<ReadLocalVaultNoteRes>> {
    return this.repositoryApi.readLocalVaultNote(request);
  }

  async searchLocalVault(request: SearchLocalVaultReq): Promise<Result<SearchLocalVaultRes>> {
    return this.repositoryApi.searchLocalVault(request);
  }

  async openLocalVaultInObsidian(request: OpenLocalVaultInObsidianReq): Promise<Result<void>> {
    return this.repositoryApi.openLocalVaultInObsidian(request);
  }

  async writeConfirmedLocalVaultNote(
    request: ConfirmedLocalVaultWriteReq,
  ): Promise<Result<ConfirmedLocalVaultWriteRes>> {
    return this.repositoryApi.writeConfirmedLocalVaultNote(request);
  }
}

// ===== Factory =====

export function createRepositoryClientService(
  repositoryApi: IRepositoryApiClient,
): RepositoryClientService {
  return new RepositoryClientService(repositoryApi);
}
