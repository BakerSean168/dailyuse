import type {
  IAccountClosureOperationRepository,
  AccountClosureOperationRecord,
  CASUpdatePhaseParams,
} from '../../../domain/repositories/i-account-closure-operation-repository';

export class InMemoryAccountClosureOperationRepository
  implements IAccountClosureOperationRepository
{
  private readonly records = new Map<string, AccountClosureOperationRecord>();

  private makeKey(identityId: string, idempotencyKey: string): string {
    return `${identityId}:${idempotencyKey}`;
  }

  async findByIdentityAndIdempotencyKey(
    identityId: string,
    idempotencyKey: string,
  ): Promise<AccountClosureOperationRecord | null> {
    const record = this.records.get(this.makeKey(identityId, idempotencyKey));
    if (!record) return null;
    return { ...record };
  }

  async findActiveByIdentityId(
    identityId: string,
  ): Promise<AccountClosureOperationRecord | null> {
    const list = Array.from(this.records.values())
      .filter(
        (r) =>
          r.identityId === identityId &&
          ['requested', 'revoking', 'revoked', 'closing', 'closed'].includes(r.phase),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return list.length > 0 ? { ...list[0] } : null;
  }

  async listByIdentityId(identityId: string): Promise<AccountClosureOperationRecord[]> {
    return Array.from(this.records.values())
      .filter((r) => r.identityId === identityId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async resetForReplay(
    identityId: string,
    id: string,
  ): Promise<AccountClosureOperationRecord> {
    for (const [key, record] of this.records.entries()) {
      if (record.id === id && record.identityId === identityId) {
        if (record.status !== 'failed') {
          throw new Error(`Closure operation '${id}' is not replayable (status: ${record.status})`);
        }
        const now = new Date();
        const updated: AccountClosureOperationRecord = {
          ...record,
          status: 'running',
          deadLetterAt: null,
          nextRetryAt: new Date(now.getTime() - 1000),
          lastError: null,
          ownerToken: null,
          leaseExpiresAt: null,
          updatedAt: now,
        };
        this.records.set(key, updated);
        return { ...updated };
      }
    }
    throw new Error(`Closure operation '${id}' not found for this identity`);
  }

  async create(record: AccountClosureOperationRecord): Promise<boolean> {
    const key = this.makeKey(record.identityId, record.idempotencyKey);
    if (this.records.has(key)) {
      return false;
    }
    this.records.set(key, { ...record });
    return true;
  }

  async claimOwnership(
    params: import('../../../domain/repositories/i-account-closure-operation-repository').ClaimOwnershipParams,
  ): Promise<boolean> {
    for (const [key, record] of this.records.entries()) {
      if (record.id === params.id && record.identityId === params.identityId) {
        if (params.expectedStatus && record.status !== params.expectedStatus) {
          return false;
        }
        const isExpired = record.leaseExpiresAt ? record.leaseExpiresAt < params.now : true;
        const isOwner = record.ownerToken === params.ownerToken;
        const isUnowned = record.ownerToken === null;
        // A failed operation's run is dead: any retrier may take over via the
        // status='failed' CAS guard (no lease requirement).
        const retryTakeover = params.expectedStatus === 'failed';
        if (retryTakeover || isUnowned || isExpired || isOwner) {
          this.records.set(key, {
            ...record,
            ownerToken: params.ownerToken,
            leaseExpiresAt: params.leaseExpiresAt,
            lastHeartbeatAt: params.now,
            status: 'running',
            attempts: params.expectedStatus === 'failed' ? record.attempts + 1 : record.attempts,
            lastError: params.expectedStatus === 'failed' ? null : record.lastError,
            updatedAt: params.now,
          });
          return true;
        }
        return false;
      }
    }
    return false;
  }

  async renewHeartbeat(
    params: import('../../../domain/repositories/i-account-closure-operation-repository').RenewHeartbeatParams,
  ): Promise<boolean> {
    for (const [key, record] of this.records.entries()) {
      if (
        record.id === params.id &&
        record.identityId === params.identityId &&
        record.ownerToken === params.ownerToken &&
        record.status === 'running'
      ) {
        this.records.set(key, {
          ...record,
          leaseExpiresAt: params.leaseExpiresAt,
          lastHeartbeatAt: params.now,
          updatedAt: params.now,
        });
        return true;
      }
    }
    return false;
  }

  async updatePhaseCAS(params: CASUpdatePhaseParams): Promise<boolean> {
    for (const [key, record] of this.records.entries()) {
      if (
        record.id === params.id &&
        record.identityId === params.identityId &&
        record.phase === params.expectedPhase
      ) {
        if (params.ownerToken) {
          if (record.ownerToken !== params.ownerToken) {
            return false;
          }
        }
        const updated: AccountClosureOperationRecord = {
          ...record,
          phase: params.newPhase,
          status: params.newStatus ?? record.status,
          ownerToken: params.ownerToken ?? record.ownerToken,
          leaseExpiresAt: params.leaseExpiresAt ?? record.leaseExpiresAt,
          lastHeartbeatAt: new Date(),
          revokedSessions: params.revokedSessions ?? record.revokedSessions,
          piiCleanupStatus: params.piiCleanupStatus ?? record.piiCleanupStatus,
          piiReason: params.piiReason ?? record.piiReason,
          eventId: params.eventId ?? record.eventId,
          lastError: params.lastError !== undefined ? params.lastError : record.lastError,
          receiptJson: params.receiptJson !== undefined ? params.receiptJson : record.receiptJson,
          finishedAt: params.finishedAt !== undefined ? params.finishedAt : record.finishedAt,
          version: record.version + 1,
          updatedAt: new Date(),
        };
        this.records.set(key, updated);
        return true;
      }
    }
    return false;
  }

  async save(record: AccountClosureOperationRecord): Promise<void> {
    const key = this.makeKey(record.identityId, record.idempotencyKey);
    this.records.set(key, { ...record });
  }

  clear(): void {
    this.records.clear();
  }
}
