import type {
  KnowledgeNoteProjectionClientDTO,
  KnowledgeNoteProjectionIndexStatus,
} from '@dailyuse/contracts/repository';

export type GithubWebhookDeliveryStatus =
  'Received' | 'Processing' | 'Processed' | 'Ignored' | 'Failed';

export interface GithubWebhookDeliveryRecord {
  id: string;
  connectionId: string;
  deliveryId: string;
  eventName: string;
  beforeSha: string | null;
  afterSha: string | null;
  forced: boolean;
  status: GithubWebhookDeliveryStatus;
  errorMessage: string | null;
  receivedAt: number;
  processedAt: number | null;
}

export interface IGithubWebhookDeliveryRepository {
  reserve(record: GithubWebhookDeliveryRecord): Promise<boolean>;
  findById(id: string): Promise<GithubWebhookDeliveryRecord | null>;
  listPending(limit: number): Promise<GithubWebhookDeliveryRecord[]>;
  updateStatus(
    id: string,
    status: GithubWebhookDeliveryStatus,
    errorMessage?: string | null,
  ): Promise<void>;
}

export interface KnowledgeNoteProjectionUpsert {
  id: string;
  connectionId: string;
  relativePath: string;
  commitSha: string;
  blobSha: string;
  contentHash: string;
  frontmatter: Record<string, unknown>;
  markdownContent: string;
  indexStatus: KnowledgeNoteProjectionIndexStatus;
}

export interface KnowledgeNoteProjectionDeletion {
  id: string;
  relativePath: string;
}

export interface KnowledgeNoteLinkGraphSourceSet {
  notes: KnowledgeNoteProjectionClientDTO[];
  truncated: boolean;
}

export interface IKnowledgeNoteProjectionRepository {
  applySnapshot(
    connectionId: string,
    commitSha: string,
    notes: KnowledgeNoteProjectionUpsert[],
  ): Promise<KnowledgeNoteProjectionDeletion[]>;
  applyChanges(
    connectionId: string,
    commitSha: string,
    notes: KnowledgeNoteProjectionUpsert[],
    deletedPaths: string[],
  ): Promise<void>;
  listByIdentity(
    identityId: string,
    options: { connectionId?: string; query?: string; limit: number },
  ): Promise<KnowledgeNoteProjectionClientDTO[]>;
  findByIdForIdentity(
    identityId: string,
    projectionId: string,
  ): Promise<KnowledgeNoteProjectionClientDTO | null>;
  findByPath(
    connectionId: string,
    relativePath: string,
  ): Promise<KnowledgeNoteProjectionClientDTO | null>;
  loadLinkGraphSourcesForIdentity(
    identityId: string,
    centerProjectionId: string,
    limit: number,
  ): Promise<KnowledgeNoteLinkGraphSourceSet | null>;
  updateIndexStatusForIdentity(
    identityId: string,
    projectionId: string,
    expectedContentHash: string,
    status: KnowledgeNoteProjectionIndexStatus,
  ): Promise<boolean>;
}

export type KnowledgeWriteRequestStatus = 'Pending' | 'Committed' | 'Failed';

export interface KnowledgeWriteRequestRecord {
  id: string;
  identityId: string;
  connectionId: string;
  requestId: string;
  requestHash: string;
  relativePath: string;
  status: KnowledgeWriteRequestStatus;
  commitSha: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
}

export interface IKnowledgeWriteRequestRepository {
  findByIdentityAndRequestId(
    identityId: string,
    requestId: string,
  ): Promise<KnowledgeWriteRequestRecord | null>;
  create(record: KnowledgeWriteRequestRecord): Promise<boolean>;
  retryFailed(id: string, updatedAt: number): Promise<boolean>;
  markCommitted(id: string, commitSha: string): Promise<void>;
  markFailed(id: string, code: string, message: string): Promise<void>;
}
