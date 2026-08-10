/**
 * ReminderReliableOperationPrismaAdapter - Prisma implementation of ReminderReliableOperationPort
 *
 * Implements LeaseClaim semantics, durable occurrence intent persistence,
 * idempotency check, stale owner fencing, and terminal status receipt mapping.
 */

import { randomUUID } from 'crypto';
import type { Prisma, PrismaClient, ReminderOccurrence as PrismaReminderOccurrence } from '@memoflow/database';
import {
  assertValidBusinessOperationReceipt,
  type BusinessOperationReceipt,
  type DeliveryAttempt,
  type LeaseClaim,
  LeaseFencingException,
  type ReminderClaimOccurrenceInput,
  ReminderClaimOccurrenceInputSchema,
  type ReminderHeartbeatInput,
  ReminderHeartbeatInputSchema,
  type ReminderReplayDeadLetterInput,
  ReminderReplayDeadLetterInputSchema,
  type ReminderReliableOperationPort,
} from '@memoflow/contracts/reliable-messaging';

function formatResourceKey(templateId: string, occurrenceKey: string): string {
  return occurrenceKey.startsWith(`${templateId}:`)
    ? `reminder:template:${occurrenceKey}`
    : `reminder:template:${templateId}:${occurrenceKey}`;
}

function mapPrismaOccurrenceToReceipt(occ: PrismaReminderOccurrence): BusinessOperationReceipt {
  let lease: LeaseClaim | null = null;

  if (occ.leaseExpiresAt && occ.ownerToken && occ.claimId) {
    lease = {
      schemaVersion: 1,
      resourceKey: formatResourceKey(occ.templateId, occ.occurrenceKey),
      claimId: occ.claimId,
      fencingToken: occ.fencingToken,
      ownerToken: occ.ownerToken,
      expiresAt: occ.leaseExpiresAt.toISOString(),
      lastHeartbeatAt: occ.lastHeartbeatAt ? occ.lastHeartbeatAt.toISOString() : null,
      heartbeatIntervalMs: occ.heartbeatIntervalMs ?? null,
    };
  }

  let attemptsHistory: DeliveryAttempt[] = [];
  if (occ.attemptsHistoryJson) {
    try {
      attemptsHistory = JSON.parse(occ.attemptsHistoryJson);
    } catch {
      attemptsHistory = [];
    }
  }

  const rawReceipt = {
    schemaVersion: 1,
    operationId: occ.id,
    identityId: occ.identityId,
    source: occ.source,
    occurrenceKey: occ.occurrenceKey,
    idempotencyKey: occ.idempotencyKey,
    status: occ.status,
    attempt: occ.attempt,
    lease,
    lastError: occ.lastError,
    nextRetryAt: occ.nextRetryAt ? occ.nextRetryAt.toISOString() : null,
    deadLetterAt: occ.deadLetterAt ? occ.deadLetterAt.toISOString() : null,
    correlationId: occ.correlationId,
    causationId: occ.causationId,
    attemptsHistory,
    createdAt: occ.createdAt.toISOString(),
    updatedAt: occ.updatedAt.toISOString(),
    finishedAt: occ.finishedAt ? occ.finishedAt.toISOString() : null,
  };

  return assertValidBusinessOperationReceipt(rawReceipt);
}

export class ReminderReliableOperationPrismaAdapter implements ReminderReliableOperationPort {
  constructor(private readonly prisma: PrismaClient) {}

  async claimOccurrence(input: ReminderClaimOccurrenceInput): Promise<{
    claimed: boolean;
    lease: LeaseClaim | null;
    receipt: BusinessOperationReceipt;
  }> {
    const validatedInput = ReminderClaimOccurrenceInputSchema.parse(input);
    const now = new Date();
    const leaseDurationMs = validatedInput.leaseDurationMs || 30000;
    const leaseExpiresAt = new Date(now.getTime() + leaseDurationMs);

    const existing = await this.prisma.reminderOccurrence.findUnique({
      where: { idempotencyKey: validatedInput.idempotencyKey },
    });

    if (!existing) {
      const claimId = randomUUID();
      const fencingToken = 1;
      const heartbeatIntervalMs = Math.floor(leaseDurationMs / 3);

      try {
        const created = await this.prisma.reminderOccurrence.create({
          data: {
            id: claimId,
            identityId: validatedInput.identityId,
            templateId: validatedInput.templateId,
            source: validatedInput.source,
            occurrenceKey: validatedInput.occurrenceKey,
            idempotencyKey: validatedInput.idempotencyKey,
            status: 'running',
            attempt: 1,
            ownerToken: validatedInput.ownerToken,
            claimId,
            fencingToken,
            leaseExpiresAt,
            lastHeartbeatAt: now,
            heartbeatIntervalMs,
            createdAt: now,
            updatedAt: now,
          },
        });

        const receipt = mapPrismaOccurrenceToReceipt(created);
        return {
          claimed: true,
          lease: receipt.lease,
          receipt,
        };
      } catch (err) {
        const reFetched = await this.prisma.reminderOccurrence.findUnique({
          where: { idempotencyKey: validatedInput.idempotencyKey },
        });
        if (!reFetched) throw err;
        return this.handleExistingOccurrence(reFetched, validatedInput, now, leaseDurationMs);
      }
    }

    return this.handleExistingOccurrence(existing, validatedInput, now, leaseDurationMs);
  }

  private async handleExistingOccurrence(
    existing: PrismaReminderOccurrence,
    input: ReminderClaimOccurrenceInput,
    now: Date,
    leaseDurationMs: number,
  ): Promise<{
    claimed: boolean;
    lease: LeaseClaim | null;
    receipt: BusinessOperationReceipt;
  }> {
    const isTerminal = ['succeeded', 'skipped', 'failed', 'cancelled'].includes(existing.status);

    if (isTerminal || existing.status === 'dead_letter') {
      const receipt = mapPrismaOccurrenceToReceipt(existing);
      return {
        claimed: false,
        lease: null,
        receipt,
      };
    }

    if (existing.status === 'retryable') {
      if (existing.nextRetryAt && existing.nextRetryAt > now) {
        const receipt = mapPrismaOccurrenceToReceipt(existing);
        return {
          claimed: false,
          lease: null,
          receipt,
        };
      }
    }

    const isLeaseExpired = existing.leaseExpiresAt ? existing.leaseExpiresAt < now : true;
    const isRetryableDue = existing.status === 'retryable' && (!existing.nextRetryAt || existing.nextRetryAt <= now);

    if (isLeaseExpired || isRetryableDue) {
      const newFencingToken = (existing.fencingToken || 0) + 1;
      const newClaimId = randomUUID();
      const newLeaseExpiresAt = new Date(now.getTime() + leaseDurationMs);

      const result = await this.prisma.reminderOccurrence.updateMany({
        where: {
          id: existing.id,
          fencingToken: existing.fencingToken,
          OR: [
            {
              status: 'retryable',
              OR: [{ nextRetryAt: { lte: now } }, { nextRetryAt: null }],
            },
            {
              status: 'running',
              leaseExpiresAt: { lt: now },
            },
            {
              status: 'pending',
            },
          ],
        },
        data: {
          ownerToken: input.ownerToken,
          claimId: newClaimId,
          fencingToken: newFencingToken,
          leaseExpiresAt: newLeaseExpiresAt,
          lastHeartbeatAt: now,
          status: 'running',
          nextRetryAt: null,
          attempt: { increment: 1 },
          updatedAt: now,
        },
      });

      if (result.count === 1) {
        const updated = await this.prisma.reminderOccurrence.findUniqueOrThrow({
          where: { id: existing.id },
        });
        const receipt = mapPrismaOccurrenceToReceipt(updated);
        return {
          claimed: true,
          lease: receipt.lease,
          receipt,
        };
      } else {
        const reFetched = await this.prisma.reminderOccurrence.findUniqueOrThrow({
          where: { id: existing.id },
        });
        const receipt = mapPrismaOccurrenceToReceipt(reFetched);
        return {
          claimed: false,
          lease: receipt.lease,
          receipt,
        };
      }
    }

    if (existing.ownerToken === input.ownerToken) {
      const receipt = mapPrismaOccurrenceToReceipt(existing);
      return {
        claimed: true,
        lease: receipt.lease,
        receipt,
      };
    }

    const receipt = mapPrismaOccurrenceToReceipt(existing);
    return {
      claimed: false,
      lease: null,
      receipt,
    };
  }

  async heartbeatLease(input: ReminderHeartbeatInput): Promise<{
    renewed: boolean;
    lease: LeaseClaim | null;
    receipt: BusinessOperationReceipt;
  }> {
    const validatedInput = ReminderHeartbeatInputSchema.parse(input);
    const now = new Date();
    const leaseDurationMs = validatedInput.leaseDurationMs || 30000;
    const newLeaseExpiresAt = new Date(now.getTime() + leaseDurationMs);

    const result = await this.prisma.reminderOccurrence.updateMany({
      where: {
        OR: [
          { claimId: validatedInput.claimId },
          { id: validatedInput.claimId },
        ],
        ownerToken: validatedInput.ownerToken,
        fencingToken: validatedInput.fencingToken,
        status: 'running',
        leaseExpiresAt: { gt: now },
      },
      data: {
        lastHeartbeatAt: now,
        leaseExpiresAt: newLeaseExpiresAt,
        updatedAt: now,
      },
    });

    if (result.count === 1) {
      const updated = await this.prisma.reminderOccurrence.findFirstOrThrow({
        where: {
          OR: [
            { claimId: validatedInput.claimId },
            { id: validatedInput.claimId },
          ],
        },
      });
      const receipt = mapPrismaOccurrenceToReceipt(updated);
      return {
        renewed: true,
        lease: receipt.lease,
        receipt,
      };
    }

    const existing = await this.prisma.reminderOccurrence.findFirst({
      where: {
        OR: [
          { claimId: validatedInput.claimId },
          { id: validatedInput.claimId },
        ],
      },
    });

    if (!existing) {
      throw new LeaseFencingException(
        formatResourceKey(validatedInput.templateId, validatedInput.occurrenceKey),
        `Occurrence '${validatedInput.claimId}' not found.`,
      );
    }

    if (existing.fencingToken !== validatedInput.fencingToken) {
      throw new LeaseFencingException(
        formatResourceKey(validatedInput.templateId, validatedInput.occurrenceKey),
        `Stale fencing token: expected ${validatedInput.fencingToken}, active is ${existing.fencingToken}`,
        existing.fencingToken,
        validatedInput.fencingToken,
      );
    }

    if (existing.ownerToken !== validatedInput.ownerToken) {
      throw new LeaseFencingException(
        formatResourceKey(validatedInput.templateId, validatedInput.occurrenceKey),
        `Owner token mismatch: active owner is '${existing.ownerToken}', incoming is '${validatedInput.ownerToken}'`,
      );
    }

    const receipt = mapPrismaOccurrenceToReceipt(existing);
    return { renewed: false, lease: null, receipt };
  }

  async recordDeliveryIntent(receipt: BusinessOperationReceipt): Promise<BusinessOperationReceipt> {
    const validatedReceipt = assertValidBusinessOperationReceipt(receipt);
    const isTerminal = ['succeeded', 'skipped', 'failed', 'cancelled'].includes(validatedReceipt.status);

    const whereCondition: Prisma.ReminderOccurrenceWhereInput = {
      idempotencyKey: validatedReceipt.idempotencyKey,
    };

    if (validatedReceipt.lease) {
      whereCondition.claimId = validatedReceipt.lease.claimId;
      whereCondition.fencingToken = validatedReceipt.lease.fencingToken;
    } else if (validatedReceipt.operationId) {
      whereCondition.claimId = validatedReceipt.operationId;
    }

    const result = await this.prisma.reminderOccurrence.updateMany({
      where: whereCondition,
      data: {
        status: validatedReceipt.status,
        attempt: validatedReceipt.attempt,
        lastError: validatedReceipt.lastError,
        nextRetryAt: validatedReceipt.nextRetryAt ? new Date(validatedReceipt.nextRetryAt) : null,
        deadLetterAt: validatedReceipt.deadLetterAt ? new Date(validatedReceipt.deadLetterAt) : null,
        finishedAt: validatedReceipt.finishedAt ? new Date(validatedReceipt.finishedAt) : isTerminal ? new Date() : null,
        ownerToken: isTerminal ? null : validatedReceipt.lease?.ownerToken ?? null,
        claimId: isTerminal ? null : validatedReceipt.lease?.claimId ?? null,
        leaseExpiresAt: isTerminal ? null : validatedReceipt.lease?.expiresAt ? new Date(validatedReceipt.lease.expiresAt) : null,
        attemptsHistoryJson: validatedReceipt.attemptsHistory ? JSON.stringify(validatedReceipt.attemptsHistory) : null,
        updatedAt: new Date(),
      },
    });

    if (result.count === 1) {
      const updated = await this.prisma.reminderOccurrence.findUniqueOrThrow({
        where: { idempotencyKey: validatedReceipt.idempotencyKey },
      });
      return mapPrismaOccurrenceToReceipt(updated);
    }

    const existing = await this.prisma.reminderOccurrence.findUniqueOrThrow({
      where: { idempotencyKey: validatedReceipt.idempotencyKey },
    });
    return mapPrismaOccurrenceToReceipt(existing);
  }

  async queryDeadLetters(identityId: string): Promise<BusinessOperationReceipt[]> {
    if (!identityId) {
      throw new Error('identityId is required');
    }
    const deadLetters = await this.prisma.reminderOccurrence.findMany({
      where: {
        identityId,
        status: 'dead_letter',
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    return deadLetters.map(mapPrismaOccurrenceToReceipt);
  }

  async replayDeadLetter(input: ReminderReplayDeadLetterInput): Promise<BusinessOperationReceipt> {
    const validatedInput = ReminderReplayDeadLetterInputSchema.parse(input);
    const now = new Date();

    const whereCondition: Prisma.ReminderOccurrenceWhereInput = {
      identityId: validatedInput.identityId,
      status: 'dead_letter',
    };

    if (validatedInput.operationId) {
      whereCondition.id = validatedInput.operationId;
    } else if (validatedInput.occurrenceKey) {
      whereCondition.occurrenceKey = validatedInput.occurrenceKey;
    }

    const existing = await this.prisma.reminderOccurrence.findFirst({
      where: whereCondition,
    });

    if (!existing) {
      throw new Error(
        `Dead letter occurrence not found for identityId '${validatedInput.identityId}'`,
      );
    }

    const updateResult = await this.prisma.reminderOccurrence.updateMany({
      where: {
        id: existing.id,
        status: 'dead_letter',
      },
      data: {
        status: 'retryable',
        nextRetryAt: new Date(now.getTime() - 1000),
        deadLetterAt: null,
        ownerToken: null,
        claimId: null,
        leaseExpiresAt: null,
        updatedAt: now,
      },
    });

    if (updateResult.count === 0) {
      const reFetched = await this.prisma.reminderOccurrence.findUniqueOrThrow({
        where: { id: existing.id },
      });
      return mapPrismaOccurrenceToReceipt(reFetched);
    }

    const updated = await this.prisma.reminderOccurrence.findUniqueOrThrow({
      where: { id: existing.id },
    });

    return mapPrismaOccurrenceToReceipt(updated);
  }
}
