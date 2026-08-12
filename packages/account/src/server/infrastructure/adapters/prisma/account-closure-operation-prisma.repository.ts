import type { PrismaClient } from '@memoflow/database';
import type {
  IAccountClosureOperationRepository,
  AccountClosureOperationRecord,
  AccountClosurePhase,
  AccountClosureStatus,
  CASUpdatePhaseParams,
} from '../../../domain/repositories/i-account-closure-operation-repository';
import type { OperationAuditRecordInput } from '@memoflow/patterns/operations';

interface ClosureOperationDb {
  accountClosureOperation: PrismaClient['accountClosureOperation'];
}

export class PrismaAccountClosureOperationRepository
  implements IAccountClosureOperationRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  private client(tx?: ClosureOperationDb): ClosureOperationDb {
    return tx ?? this.prisma;
  }

  private mapRowToRecord(row: {
    id: string;
    identityId: string;
    idempotencyKey: string;
    phase: string;
    status: string;
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
  }): AccountClosureOperationRecord {
    return {
      id: row.id,
      identityId: row.identityId,
      idempotencyKey: row.idempotencyKey,
      phase: row.phase as AccountClosurePhase,
      status: row.status as AccountClosureStatus,
      attempts: row.attempts,
      version: row.version,
      ownerToken: row.ownerToken,
      leaseExpiresAt: row.leaseExpiresAt,
      lastHeartbeatAt: row.lastHeartbeatAt,
      nextRetryAt: row.nextRetryAt,
      deadLetterAt: row.deadLetterAt,
      eventId: row.eventId,
      reason: row.reason,
      revokedSessions: row.revokedSessions,
      piiCleanupStatus: row.piiCleanupStatus,
      piiReason: row.piiReason,
      lastError: row.lastError,
      receiptJson: row.receiptJson,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      finishedAt: row.finishedAt,
    };
  }

  async findByIdentityAndIdempotencyKey(
    identityId: string,
    idempotencyKey: string,
    tx?: ClosureOperationDb,
  ): Promise<AccountClosureOperationRecord | null> {
    const row = await this.client(tx).accountClosureOperation.findUnique({
      where: {
        identityId_idempotencyKey: {
          identityId,
          idempotencyKey,
        },
      },
    });
    if (!row) return null;
    return this.mapRowToRecord(row);
  }

  async findActiveByIdentityId(
    identityId: string,
    tx?: ClosureOperationDb,
  ): Promise<AccountClosureOperationRecord | null> {
    const row = await this.client(tx).accountClosureOperation.findFirst({
      where: {
        identityId,
        phase: { in: ['requested', 'revoking', 'revoked', 'closing', 'closed'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!row) return null;
    return this.mapRowToRecord(row);
  }

  async listByIdentityId(
    identityId: string,
  ): Promise<AccountClosureOperationRecord[]> {
    if (!identityId) {
      throw new Error('identityId is required for closure timeline query');
    }
    const rows = await this.prisma.accountClosureOperation.findMany({
      where: { identityId },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => this.mapRowToRecord(row));
  }

  async resetForReplay(
    identityId: string,
    id: string,
  ): Promise<AccountClosureOperationRecord> {
    if (!identityId || !id) {
      throw new Error('identityId and id are required for closure replay');
    }
    const existing = await this.prisma.accountClosureOperation.findFirst({
      where: { id, identityId },
    });
    if (!existing) {
      throw new Error(`Closure operation '${id}' not found for this identity`);
    }
    if (existing.status !== 'failed') {
      throw new Error(
        `Closure operation '${id}' is not replayable (status: ${existing.status})`,
      );
    }
    const now = new Date();
    const updated = await this.prisma.accountClosureOperation.update({
      where: { id: existing.id },
      data: {
        status: 'running',
        deadLetterAt: null,
        nextRetryAt: new Date(now.getTime() - 1000),
        lastError: null,
        ownerToken: null,
        leaseExpiresAt: null,
        updatedAt: now,
      },
    });
    return this.mapRowToRecord(updated);
  }

  /**
   * P1-4：与审计同一事务的 closure replay。状态推进与 audit 事实同入一个
   * `prisma.$transaction`；审计写失败时整个事务回滚，绝不留下
   * “已重放但无审计”的部分成功。
   */
  async resetForReplayWithAudit(
    identityId: string,
    id: string,
    audit: OperationAuditRecordInput,
    auditRepository: import('@memoflow/patterns/operations').OperationAuditRepository,
  ): Promise<AccountClosureOperationRecord> {
    if (!identityId || !id) {
      throw new Error('identityId and id are required for closure replay');
    }
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.accountClosureOperation.findFirst({
        where: { id, identityId },
      });
      if (!existing) {
        throw new Error(`Closure operation '${id}' not found for this identity`);
      }
      if (existing.status !== 'failed') {
        throw new Error(
          `Closure operation '${id}' is not replayable (status: ${existing.status})`,
        );
      }
      const now = new Date();
      const updated = await tx.accountClosureOperation.update({
        where: { id: existing.id },
        data: {
          status: 'running',
          deadLetterAt: null,
          nextRetryAt: new Date(now.getTime() - 1000),
          lastError: null,
          ownerToken: null,
          leaseExpiresAt: null,
          updatedAt: now,
        },
      });
      await auditRepository.record(
        {
          ...audit,
          details: `status -> ${updated.status}`,
        },
        tx,
      );
      return this.mapRowToRecord(updated);
    });
  }

  async create(
    record: AccountClosureOperationRecord,
    tx?: ClosureOperationDb,
  ): Promise<boolean> {
    try {
      await this.client(tx).accountClosureOperation.create({
        data: {
          id: record.id,
          identityId: record.identityId,
          idempotencyKey: record.idempotencyKey,
          phase: record.phase,
          status: record.status,
          attempts: record.attempts,
          version: record.version ?? 1,
          ownerToken: record.ownerToken,
          leaseExpiresAt: record.leaseExpiresAt,
          lastHeartbeatAt: record.lastHeartbeatAt,
          nextRetryAt: record.nextRetryAt,
          deadLetterAt: record.deadLetterAt,
          eventId: record.eventId,
          reason: record.reason,
          revokedSessions: record.revokedSessions ?? 0,
          piiCleanupStatus: record.piiCleanupStatus,
          piiReason: record.piiReason,
          lastError: record.lastError,
          receiptJson: record.receiptJson,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          finishedAt: record.finishedAt,
        },
      });
      return true;
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        return false;
      }
      throw err;
    }
  }

  async claimOwnership(
    params: import('../../../domain/repositories/i-account-closure-operation-repository').ClaimOwnershipParams,
    tx?: ClosureOperationDb,
  ): Promise<boolean> {
    const db = this.client(tx);
    const whereClause: Record<string, unknown> = {
      id: params.id,
      identityId: params.identityId,
    };

    if (params.expectedStatus === 'failed') {
      whereClause.status = 'failed';
    } else {
      if (params.expectedStatus) {
        whereClause.status = params.expectedStatus;
      }
      whereClause.OR = [
        { ownerToken: null },
        { leaseExpiresAt: { lt: params.now } },
        { ownerToken: params.ownerToken },
      ];
    }

    const result = await db.accountClosureOperation.updateMany({
      where: whereClause,
      data: {
        ownerToken: params.ownerToken,
        leaseExpiresAt: params.leaseExpiresAt,
        lastHeartbeatAt: params.now,
        status: 'running',
        updatedAt: params.now,
        ...(params.expectedStatus === 'failed'
          ? { attempts: { increment: 1 }, lastError: null }
          : {}),
      },
    });
    return result.count > 0;
  }

  async renewHeartbeat(
    params: import('../../../domain/repositories/i-account-closure-operation-repository').RenewHeartbeatParams,
    tx?: ClosureOperationDb,
  ): Promise<boolean> {
    const result = await this.client(tx).accountClosureOperation.updateMany({
      where: {
        id: params.id,
        identityId: params.identityId,
        ownerToken: params.ownerToken,
        status: 'running',
      },
      data: {
        leaseExpiresAt: params.leaseExpiresAt,
        lastHeartbeatAt: params.now,
        updatedAt: params.now,
      },
    });
    return result.count > 0;
  }

  async updatePhaseCAS(
    params: CASUpdatePhaseParams,
    tx?: ClosureOperationDb,
  ): Promise<boolean> {
    const whereClause: Record<string, unknown> = {
      id: params.id,
      identityId: params.identityId,
      phase: params.expectedPhase,
    };

    if (params.ownerToken) {
      whereClause.ownerToken = params.ownerToken;
    }

    const result = await this.client(tx).accountClosureOperation.updateMany({
      where: whereClause,
      data: {
        phase: params.newPhase,
        status: params.newStatus ?? undefined,
        ownerToken: params.ownerToken ?? undefined,
        leaseExpiresAt: params.leaseExpiresAt ?? undefined,
        lastHeartbeatAt: new Date(),
        revokedSessions: params.revokedSessions ?? undefined,
        piiCleanupStatus: params.piiCleanupStatus ?? undefined,
        piiReason: params.piiReason ?? undefined,
        eventId: params.eventId ?? undefined,
        lastError: params.lastError,
        receiptJson: params.receiptJson,
        finishedAt: params.finishedAt,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });
    return result.count > 0;
  }

  async save(record: AccountClosureOperationRecord, tx?: ClosureOperationDb): Promise<void> {
    const db = this.client(tx);
    await db.accountClosureOperation.upsert({
      where: {
        identityId_idempotencyKey: {
          identityId: record.identityId,
          idempotencyKey: record.idempotencyKey,
        },
      },
      update: {
        phase: record.phase,
        status: record.status,
        attempts: record.attempts,
        version: record.version ? { increment: 1 } : undefined,
        ownerToken: record.ownerToken,
        leaseExpiresAt: record.leaseExpiresAt,
        lastHeartbeatAt: record.lastHeartbeatAt,
        nextRetryAt: record.nextRetryAt,
        deadLetterAt: record.deadLetterAt,
        eventId: record.eventId,
        reason: record.reason,
        revokedSessions: record.revokedSessions,
        piiCleanupStatus: record.piiCleanupStatus,
        piiReason: record.piiReason,
        lastError: record.lastError,
        receiptJson: record.receiptJson,
        updatedAt: record.updatedAt,
        finishedAt: record.finishedAt,
      },
      create: {
        id: record.id,
        identityId: record.identityId,
        idempotencyKey: record.idempotencyKey,
        phase: record.phase,
        status: record.status,
        attempts: record.attempts,
        version: record.version ?? 1,
        ownerToken: record.ownerToken,
        leaseExpiresAt: record.leaseExpiresAt,
        lastHeartbeatAt: record.lastHeartbeatAt,
        nextRetryAt: record.nextRetryAt,
        deadLetterAt: record.deadLetterAt,
        eventId: record.eventId,
        reason: record.reason,
        revokedSessions: record.revokedSessions ?? 0,
        piiCleanupStatus: record.piiCleanupStatus,
        piiReason: record.piiReason,
        lastError: record.lastError,
        receiptJson: record.receiptJson,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        finishedAt: record.finishedAt,
      },
    });
  }
}
