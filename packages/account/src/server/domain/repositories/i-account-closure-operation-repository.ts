export type AccountClosurePhase =
  | 'requested'
  | 'revoking'
  | 'revoked'
  | 'closing'
  | 'closed'
  | 'failed';

export type AccountClosureStatus = 'running' | 'succeeded' | 'failed';

export interface AccountClosureOperationRecord {
  id: string;
  identityId: string;
  idempotencyKey: string;
  phase: AccountClosurePhase;
  status: AccountClosureStatus;
  attempts: number;
  version: number;
  ownerToken: string | null;
  leaseExpiresAt: Date | null;
  nextRetryAt: Date | null;
  deadLetterAt: Date | null;
  eventId: string | null;
  reason: string | null;
  revokedSessions: number;
  piiCleanupStatus: string | null;
  piiReason?: string | null;
  lastHeartbeatAt?: Date | null;
  lastError: string | null;
  receiptJson: string | null;
  createdAt: Date;
  updatedAt: Date;
  finishedAt: Date | null;
}

export interface CASUpdatePhaseParams {
  id: string;
  identityId: string;
  expectedPhase: AccountClosurePhase;
  newPhase: AccountClosurePhase;
  ownerToken?: string;
  newStatus?: AccountClosureStatus;
  revokedSessions?: number;
  piiCleanupStatus?: string;
  piiReason?: string;
  eventId?: string;
  lastError?: string | null;
  receiptJson?: string | null;
  finishedAt?: Date | null;
  leaseExpiresAt?: Date;
}

export interface ClaimOwnershipParams {
  id: string;
  identityId: string;
  ownerToken: string;
  leaseExpiresAt: Date;
  now: Date;
  expectedStatus?: AccountClosureStatus;
}

export interface RenewHeartbeatParams {
  id: string;
  identityId: string;
  ownerToken: string;
  leaseExpiresAt: Date;
  now: Date;
}

export interface IAccountClosureOperationRepository {
  findByIdentityAndIdempotencyKey(
    identityId: string,
    idempotencyKey: string,
    tx?: unknown,
  ): Promise<AccountClosureOperationRecord | null>;

  findActiveByIdentityId(
    identityId: string,
    tx?: unknown,
  ): Promise<AccountClosureOperationRecord | null>;

  create(record: AccountClosureOperationRecord, tx?: unknown): Promise<boolean>;

  claimOwnership(params: ClaimOwnershipParams, tx?: unknown): Promise<boolean>;

  renewHeartbeat(params: RenewHeartbeatParams, tx?: unknown): Promise<boolean>;

  updatePhaseCAS(params: CASUpdatePhaseParams, tx?: unknown): Promise<boolean>;

  save(record: AccountClosureOperationRecord, tx?: unknown): Promise<void>;
}
