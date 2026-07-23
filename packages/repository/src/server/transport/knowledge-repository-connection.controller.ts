import type { Result } from '@dailyuse/contracts/result';
import { fail, ok } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import {
  CompleteKnowledgeRepositoryInstallationSchema,
  ConfirmKnowledgeRepositoryHeadSchema,
  CreateKnowledgeRepositoryConnectionSchema,
  DisconnectKnowledgeRepositoryConnectionSchema,
  KnowledgeRepositoryConnectionParamsSchema,
  PreviewKnowledgeRepositoryReconciliationSchema,
  StartKnowledgeRepositoryInstallationSchema,
  type CompleteKnowledgeRepositoryInstallationReq,
  type CompleteKnowledgeRepositoryInstallationRes,
  type ConfirmKnowledgeRepositoryHeadReq,
  type CreateKnowledgeRepositoryConnectionReq,
  type KnowledgeRepositoryConnectionClientDTO,
  type KnowledgeRepositoryInstallationTokenRes,
  type KnowledgeRepositoryReconciliationPreview,
  type ListKnowledgeRepositoryConnectionsRes,
  type StartKnowledgeRepositoryInstallationReq,
  type StartKnowledgeRepositoryInstallationRes,
  type DisconnectKnowledgeRepositoryConnectionRes,
  type PreviewKnowledgeRepositoryReconciliationReq,
  ListKnowledgeProjectionsSchema,
  CreateConfirmedKnowledgeNoteSchema,
  GetKnowledgeNoteLinkGraphSchema,
  type CreateConfirmedKnowledgeNoteReq,
  type CreateConfirmedKnowledgeNoteResponse,
  type KnowledgeNoteProjectionClientDTO,
  type KnowledgeNoteProjectionListResponse,
  type ListKnowledgeNoteProjectionsReq,
  type GetKnowledgeNoteLinkGraphReq,
  type KnowledgeNoteLinkGraphResponse,
  type KnowledgeAttachmentContentResponse,
  type KnowledgeAttachmentProjectionListResponse,
  type ListKnowledgeAttachmentProjectionsReq,
} from '@dailyuse/contracts/repository';
import { formatZodErrors } from '@dailyuse/utils/result';

export interface KnowledgeRepositoryConnectionUseCases {
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
}

export class KnowledgeRepositoryConnectionController {
  constructor(private readonly useCases: KnowledgeRepositoryConnectionUseCases) {}

  async startInstallation(ctx: Context, input: unknown) {
    const parsed = StartKnowledgeRepositoryInstallationSchema.safeParse(input ?? {});
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid GitHub App installation request',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.startKnowledgeRepositoryInstallation(ctx, parsed.data);
  }

  async completeInstallation(ctx: Context, input: unknown) {
    const parsed = CompleteKnowledgeRepositoryInstallationSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid GitHub App installation callback',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.completeKnowledgeRepositoryInstallation(ctx, parsed.data);
  }

  async listConnections(ctx: Context) {
    return this.useCases.listKnowledgeRepositoryConnections(ctx);
  }

  async connect(ctx: Context, input: unknown) {
    const parsed = CreateKnowledgeRepositoryConnectionSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid knowledge repository connection request',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.connectKnowledgeRepository(ctx, parsed.data);
  }

  async disconnect(ctx: Context, input: unknown): Promise<Result<null>> {
    const parsed = DisconnectKnowledgeRepositoryConnectionSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid knowledge repository connection id',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const result = await this.useCases.disconnectKnowledgeRepository(
      ctx,
      parsed.data.connectionId,
      parsed.data.purgeCloudData,
    );
    if (!result.ok) return result as Result<null>;
    // Serialize as data:null (no { disconnected: true } dual-track body).
    return ok(null);
  }

  async issueDesktopToken(ctx: Context, input: unknown) {
    const parsed = KnowledgeRepositoryConnectionParamsSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid knowledge repository connection id',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.issueDesktopKnowledgeRepositoryToken(ctx, parsed.data.connectionId);
  }

  async previewReconciliation(ctx: Context, paramsInput: unknown, bodyInput: unknown) {
    const params = KnowledgeRepositoryConnectionParamsSchema.safeParse(paramsInput);
    const body = PreviewKnowledgeRepositoryReconciliationSchema.safeParse(bodyInput);
    if (!params.success || !body.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid knowledge repository reconciliation preview request',
        details: formatZodErrors([
          ...(params.success ? [] : params.error.issues),
          ...(body.success ? [] : body.error.issues),
        ]),
      });
    }
    return this.useCases.previewKnowledgeRepositoryReconciliation(
      ctx,
      params.data.connectionId,
      body.data,
    );
  }

  async confirmHead(ctx: Context, paramsInput: unknown, bodyInput: unknown) {
    const params = KnowledgeRepositoryConnectionParamsSchema.safeParse(paramsInput);
    const body = ConfirmKnowledgeRepositoryHeadSchema.safeParse(bodyInput);
    if (!params.success || !body.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid knowledge repository HEAD confirmation',
        details: formatZodErrors([
          ...(params.success ? [] : params.error.issues),
          ...(body.success ? [] : body.error.issues),
        ]),
      });
    }
    return this.useCases.confirmKnowledgeRepositoryHead(ctx, params.data.connectionId, body.data);
  }

  async listNotes(ctx: Context, input: unknown) {
    const parsed = ListKnowledgeProjectionsSchema.safeParse(input ?? {});
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid knowledge note query',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.listKnowledgeNoteProjections(ctx, parsed.data);
  }

  async getNote(ctx: Context, projectionId: string) {
    if (!projectionId) {
      return fail({ code: 'VALIDATION_ERROR', message: 'projectionId is required' });
    }
    return this.useCases.getKnowledgeNoteProjection(ctx, projectionId);
  }

  async getNoteLinkGraph(ctx: Context, projectionId: string, input: unknown) {
    const parsed = GetKnowledgeNoteLinkGraphSchema.safeParse(input ?? {});
    if (!projectionId || !parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid knowledge note link graph request',
        details: parsed.success ? undefined : formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.getKnowledgeNoteLinkGraph(ctx, projectionId, parsed.data);
  }

  async listAttachments(ctx: Context, input: unknown) {
    const parsed = ListKnowledgeProjectionsSchema.safeParse(input ?? {});
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid knowledge attachment query',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.listKnowledgeAttachmentProjections(ctx, parsed.data);
  }

  async getAttachmentContent(ctx: Context, projectionId: string) {
    if (!projectionId) {
      return fail({ code: 'VALIDATION_ERROR', message: 'projectionId is required' });
    }
    return this.useCases.getKnowledgeAttachmentContent(ctx, projectionId);
  }

  async createNote(ctx: Context, input: unknown) {
    const parsed = CreateConfirmedKnowledgeNoteSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid confirmed knowledge note request',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.createConfirmedKnowledgeNote(ctx, parsed.data);
  }
}
