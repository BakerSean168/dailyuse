import type { Result } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import type {
  ResourceClientDTO,
  UploadResourcesResponseDTO,
  CompleteKnowledgeRepositoryInstallationReq,
  CompleteKnowledgeRepositoryInstallationRes,
  ConfirmKnowledgeRepositoryHeadReq,
  CreateKnowledgeRepositoryConnectionReq,
  KnowledgeRepositoryInstallationTokenRes,
  KnowledgeRepositoryConnectionClientDTO,
  ListKnowledgeRepositoryConnectionsRes,
  StartKnowledgeRepositoryInstallationReq,
  StartKnowledgeRepositoryInstallationRes,
  DisconnectKnowledgeRepositoryConnectionRes,
  KnowledgeRepositoryReconciliationPreview,
  PreviewKnowledgeRepositoryReconciliationReq,
  CreateConfirmedKnowledgeNoteReq,
  CreateConfirmedKnowledgeNoteResponse,
  KnowledgeNoteProjectionClientDTO,
  KnowledgeNoteProjectionListResponse,
  ListKnowledgeNoteProjectionsReq,
  KnowledgeNoteProjectionIndexStatus,
  GetKnowledgeNoteLinkGraphReq,
  KnowledgeNoteLinkGraphResponse,
  KnowledgeAttachmentContentResponse,
  KnowledgeAttachmentProjectionListResponse,
  ListKnowledgeAttachmentProjectionsReq,
} from '@dailyuse/contracts/repository';

/**
 * Transport-neutral callable application surface.
 * 传输层无关的可调用应用层门面。
 */
export interface RepositoryApplicationPort {
  getCurrentRepository(ctx: Context): Promise<Result<unknown>>;
  createResource(
    data: {
      repositoryId: string;
      folderId?: string;
      name: string;
      type: string;
      path?: string;
      content?: string;
      mimeType?: string;
    },
    ctx: Context,
  ): Promise<Result<ResourceClientDTO>>;
  listResources(
    repositoryId: string,
    filters?: { folderId?: string; status?: string },
  ): Promise<Result<ResourceClientDTO[]>>;
  getResource(id: string): Promise<Result<unknown>>;
  updateResource(
    id: string,
    data: {
      name?: string;
      metadata?: Record<string, unknown>;
      content?: string;
    },
  ): Promise<Result<ResourceClientDTO>>;
  moveResource(id: string, targetFolderId: string): Promise<Result<ResourceClientDTO>>;
  deleteResource(id: string): Promise<Result<void>>;
  uploadResources(
    data: {
      repositoryId: string;
      files: unknown[];
      metadata?: unknown;
    },
    ctx: Context,
  ): Promise<Result<UploadResourcesResponseDTO>>;
  updateRepositoryStats(id: string, data: Record<string, unknown>): Promise<Result<unknown>>;
  createFolder(
    data: {
      repositoryId: string;
      name: string;
      parentId?: string;
      order?: number;
    },
    ctx: Context,
  ): Promise<Result<unknown>>;
  getFolderTree(repositoryId: string): Promise<Result<unknown>>;
  getFolder(id: string): Promise<Result<unknown>>;
  renameFolder(id: string, newName: string): Promise<Result<unknown>>;
  moveFolder(id: string, newParentId: string | null): Promise<Result<unknown>>;
  deleteFolder(id: string): Promise<Result<unknown>>;
  listResourceBookmarks(repositoryId: string, ctx: Context): Promise<Result<unknown>>;
  createResourceBookmark(
    repositoryId: string,
    data: {
      resourceId: string;
      aliasName?: string;
      icon?: string;
      color?: string;
    },
    ctx: Context,
  ): Promise<Result<unknown>>;
  updateResourceBookmark(
    repositoryId: string,
    bookmarkId: string,
    data: {
      aliasName?: string;
      icon?: string;
      color?: string;
    },
    ctx: Context,
  ): Promise<Result<unknown>>;
  reorderResourceBookmarks(
    repositoryId: string,
    data: {
      bookmarkIds: string[];
    },
    ctx: Context,
  ): Promise<Result<unknown>>;
  deleteResourceBookmark(
    repositoryId: string,
    bookmarkId: string,
    ctx: Context,
  ): Promise<Result<unknown>>;
  findActiveRepository(identityId: string): Promise<Result<unknown>>;

  // GitHub App knowledge repository authorization. This is intentionally
  // separate from authentication OAuth and may be unavailable when the app
  // is not configured in the current runtime.
  startKnowledgeRepositoryInstallation(
    ctx: Context,
    request: StartKnowledgeRepositoryInstallationReq,
  ): Promise<Result<StartKnowledgeRepositoryInstallationRes>>;
  completeKnowledgeRepositoryInstallation(
    ctx: Context,
    request: CompleteKnowledgeRepositoryInstallationReq,
  ): Promise<Result<CompleteKnowledgeRepositoryInstallationRes>>;
  listKnowledgeRepositoryConnections(
    ctx: Context,
  ): Promise<Result<ListKnowledgeRepositoryConnectionsRes>>;
  connectKnowledgeRepository(
    ctx: Context,
    request: CreateKnowledgeRepositoryConnectionReq,
  ): Promise<Result<KnowledgeRepositoryConnectionClientDTO>>;
  disconnectKnowledgeRepository(
    ctx: Context,
    connectionId: string,
    purgeCloudData?: boolean,
  ): Promise<Result<DisconnectKnowledgeRepositoryConnectionRes>>;
  issueDesktopKnowledgeRepositoryToken(
    ctx: Context,
    connectionId: string,
  ): Promise<Result<KnowledgeRepositoryInstallationTokenRes>>;
  previewKnowledgeRepositoryReconciliation(
    ctx: Context,
    connectionId: string,
    request: PreviewKnowledgeRepositoryReconciliationReq,
  ): Promise<Result<KnowledgeRepositoryReconciliationPreview>>;
  confirmKnowledgeRepositoryHead(
    ctx: Context,
    connectionId: string,
    request: ConfirmKnowledgeRepositoryHeadReq,
  ): Promise<Result<KnowledgeRepositoryConnectionClientDTO>>;
  listKnowledgeNoteProjections(
    ctx: Context,
    request: ListKnowledgeNoteProjectionsReq,
  ): Promise<Result<KnowledgeNoteProjectionListResponse>>;
  getKnowledgeNoteProjection(
    ctx: Context,
    projectionId: string,
  ): Promise<Result<KnowledgeNoteProjectionClientDTO>>;
  getKnowledgeNoteLinkGraph(
    ctx: Context,
    projectionId: string,
    request: GetKnowledgeNoteLinkGraphReq,
  ): Promise<Result<KnowledgeNoteLinkGraphResponse>>;
  listKnowledgeAttachmentProjections(
    ctx: Context,
    request: ListKnowledgeAttachmentProjectionsReq,
  ): Promise<Result<KnowledgeAttachmentProjectionListResponse>>;
  getKnowledgeAttachmentContent(
    ctx: Context,
    projectionId: string,
  ): Promise<Result<KnowledgeAttachmentContentResponse>>;
  createConfirmedKnowledgeNote(
    ctx: Context,
    request: CreateConfirmedKnowledgeNoteReq,
  ): Promise<Result<CreateConfirmedKnowledgeNoteResponse>>;
  updateKnowledgeNoteProjectionIndexStatus(
    ctx: Pick<Context, 'identityId'>,
    request: {
      projectionId: string;
      contentHash: string;
      status: KnowledgeNoteProjectionIndexStatus;
    },
  ): Promise<Result<{ updated: boolean }>>;
  ingestGithubWebhook(request: {
    deliveryId: string;
    eventName: string;
    signature: string;
    rawBody: string;
  }): Promise<Result<{ accepted: boolean; duplicate: boolean; reason?: string }>>;
}
