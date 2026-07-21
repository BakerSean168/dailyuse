import type { Result } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import type {
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
 * Transport-neutral knowledge repository application surface.
 *
 * Legacy database Repository/Folder/Resource/Bookmark CRUD was removed from the
 * runtime port. Portable backup of old rows is handled by data-portability, not
 * this application facade.
 */
export interface RepositoryApplicationPort {
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
