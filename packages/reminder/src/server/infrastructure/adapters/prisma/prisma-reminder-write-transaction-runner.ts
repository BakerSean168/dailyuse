/**
 * Prisma Reminder Write Transaction Runner
 *
 * Enforces atomic single-transaction execution of:
 * - Lease fencing check
 * - ReminderHistory creation
 * - ReminderTemplate nextTriggerAt advance
 * - canonical NotificationRequested Outbox intent persistence
 * - ReminderOccurrence status/receipt update
 */

import type { PrismaClient, Prisma } from '@memoflow/database';
import {
  assertValidBusinessOperationReceipt,
  buildIdempotencyKeyString,
  type BusinessOperationReceipt,
  type BusinessOperationStatus,
  LeaseFencingException,
} from '@memoflow/contracts/reliable-messaging';
import { TriggerResult } from '@memoflow/contracts/reminder';
import {
  NotificationCategory,
  NotificationChannelType,
  NotificationRequestedSchema,
  NotificationType,
  RelatedEntityType,
} from '@memoflow/contracts/notification';
import type {
  ReminderTransactionRunner,
  ExecuteClaimedOccurrenceTransactionParams,
} from '../../../domain/ports/reminder-transaction-runner.port';

export type { ExecuteClaimedOccurrenceTransactionParams };

export class PrismaReminderWriteTransactionRunner implements ReminderTransactionRunner {
  constructor(private readonly prisma: PrismaClient) {}

  async executeClaimedOccurrenceTransaction(
    params: ExecuteClaimedOccurrenceTransactionParams,
  ): Promise<BusinessOperationReceipt> {
    const { template, occurrence, isEnabled, skipReason, triggerTime = Date.now() } = params;
    const now = new Date();

    return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Verify fencing token and lease ownership in DB / Fencing Check
      const dbOccurrence = await tx.reminderOccurrence.findUnique({
        where: { id: occurrence.id },
      });

      if (!dbOccurrence) {
        throw new LeaseFencingException(
          `reminder:template:${occurrence.templateId}:${occurrence.occurrenceKey}`,
          `Occurrence '${occurrence.id}' not found in database.`,
        );
      }

      if (dbOccurrence.fencingToken !== occurrence.fencingToken) {
        throw new LeaseFencingException(
          `reminder:template:${occurrence.templateId}:${occurrence.occurrenceKey}`,
          `Stale fencing token: expected ${occurrence.fencingToken}, active is ${dbOccurrence.fencingToken}`,
          dbOccurrence.fencingToken,
          occurrence.fencingToken,
        );
      }

      if (dbOccurrence.ownerToken !== occurrence.ownerToken) {
        throw new LeaseFencingException(
          `reminder:template:${occurrence.templateId}:${occurrence.occurrenceKey}`,
          `Owner token mismatch: active owner is '${dbOccurrence.ownerToken}', incoming is '${occurrence.ownerToken}'`,
        );
      }

      if (dbOccurrence.leaseExpiresAt && dbOccurrence.leaseExpiresAt < now) {
        throw new LeaseFencingException(
          `reminder:template:${occurrence.templateId}:${occurrence.occurrenceKey}`,
          `Lease expired at ${dbOccurrence.leaseExpiresAt.toISOString()}`,
        );
      }

      let finalStatus: BusinessOperationStatus = 'succeeded';
      let historyResult: TriggerResult = TriggerResult.Success;
      let historyError: string | null = null;

      if (!isEnabled) {
        finalStatus = 'skipped';
        historyResult = TriggerResult.Skipped;
        historyError = skipReason ?? '模板未启用或被分组禁用';
      }

      // 2. Create history entry
      const historyEntity = template.createHistory({
        triggeredAt: triggerTime,
        result: historyResult,
        error: historyError ?? undefined,
      });
      const hDto = historyEntity.toServerDTO();

      await tx.reminderHistory.upsert({
        where: { id: hDto.id },
        create: {
          id: hDto.id,
          templateId: hDto.templateId,
          identityId: occurrence.identityId,
          triggeredAt: new Date(hDto.triggeredAt),
          result: hDto.result,
          error: hDto.error,
          notificationSent: isEnabled,
          notificationChannel: isEnabled ? JSON.stringify(['in-app']) : null,
        },
        update: {
          result: hDto.result,
          error: hDto.error,
          notificationSent: isEnabled,
        },
      });

      // 3. Advance nextTriggerAt on template and update persistence
      const nextTriggerTime = template.calculateNextTrigger();
      await tx.reminderTemplate.update({
        where: { id: template.id as string },
        data: {
          nextTriggerAt: nextTriggerTime ? new Date(nextTriggerTime) : null,
          updatedAt: now,
        },
      });

      // 4. Write the business-level NotificationRequested intent. Channel
      // policy/expansion belongs to Notification, never to Reminder/Scheduler.
      if (isEnabled) {
        const notificationIdempotencyKey = buildIdempotencyKeyString({
          identityId: occurrence.identityId,
          source: 'reminder',
          occurrenceKey: occurrence.occurrenceKey,
        });
        const operationId = `reminder-occurrence:${occurrence.id}`;
        const envelope = NotificationRequestedSchema.parse({
          identityId: occurrence.identityId,
          source: 'reminder',
          occurrenceKey: occurrence.occurrenceKey,
          idempotencyKey: notificationIdempotencyKey,
          workflowKey: 'reminder.trigger',
          topic: 'reminder.trigger',
          relatedEntity: { type: RelatedEntityType.Reminder, id: String(template.id) },
          content: {
            title: template.notificationConfig.title?.trim() || template.title,
            content:
              template.notificationConfig.body?.trim() ||
              template.description?.trim() ||
              `提醒「${template.title}」已到达。`,
            type: NotificationType.Reminder,
            category: NotificationCategory.Reminder,
          },
          suggestedChannels: [NotificationChannelType.InApp],
          correlationId: occurrence.id,
          causationId: occurrence.id,
        });
        const outboxPayload = {
          operationId,
          envelope,
          correlationId: occurrence.id,
          causationId: occurrence.id,
        };

        await tx.outboxMessage.create({
          data: {
            id: operationId,
            identityId: occurrence.identityId,
            messageType: 'notification.requested',
            schemaVersion: 1,
            correlationId: occurrence.id,
            causationId: occurrence.id,
            payloadJson: JSON.stringify(outboxPayload),
            idempotencyKey: notificationIdempotencyKey,
            status: 'pending',
            attempts: 0,
            availableAt: now,
            createdAt: now,
          },
        });
      }

      if (params.beforeCommitHook) {
        await params.beforeCommitHook();
      }

      // 5. Update occurrence status to terminal (succeeded or skipped) with conditional fencing check evaluated at commit time
      const commitNow = new Date();
      const updateResult = await tx.reminderOccurrence.updateMany({
        where: {
          id: occurrence.id,
          ownerToken: occurrence.ownerToken,
          fencingToken: occurrence.fencingToken,
          status: 'running',
          OR: [{ leaseExpiresAt: { gte: commitNow } }, { leaseExpiresAt: null }],
        },
        data: {
          status: finalStatus,
          ownerToken: null,
          claimId: null,
          leaseExpiresAt: null,
          lastError: null,
          finishedAt: commitNow,
          updatedAt: commitNow,
        },
      });

      if (updateResult.count === 0) {
        const dbState = await tx.reminderOccurrence.findUnique({
          where: { id: occurrence.id },
        });

        if (!dbState) {
          throw new LeaseFencingException(
            `reminder:template:${occurrence.templateId}:${occurrence.occurrenceKey}`,
            `Occurrence '${occurrence.id}' not found at transaction commit time.`,
          );
        }

        if (dbState.fencingToken !== occurrence.fencingToken) {
          throw new LeaseFencingException(
            `reminder:template:${occurrence.templateId}:${occurrence.occurrenceKey}`,
            `Stale fencing token at transaction commit: expected ${occurrence.fencingToken}, active is ${dbState.fencingToken}`,
            dbState.fencingToken,
            occurrence.fencingToken,
          );
        }

        if (dbState.ownerToken !== occurrence.ownerToken) {
          throw new LeaseFencingException(
            `reminder:template:${occurrence.templateId}:${occurrence.occurrenceKey}`,
            `Owner token mismatch at transaction commit: active owner is '${dbState.ownerToken}', expected '${occurrence.ownerToken}'`,
          );
        }

        if (dbState.status !== 'running') {
          throw new LeaseFencingException(
            `reminder:template:${occurrence.templateId}:${occurrence.occurrenceKey}`,
            `Status conflict at transaction commit: active status is '${dbState.status}', expected 'running'`,
          );
        }

        if (dbState.leaseExpiresAt && dbState.leaseExpiresAt < commitNow) {
          throw new LeaseFencingException(
            `reminder:template:${occurrence.templateId}:${occurrence.occurrenceKey}`,
            `Lease expired at transaction commit: lease expired at ${dbState.leaseExpiresAt.toISOString()}`,
          );
        }

        throw new LeaseFencingException(
          `reminder:template:${occurrence.templateId}:${occurrence.occurrenceKey}`,
          `Fencing check failed at transaction commit for occurrence '${occurrence.id}'.`,
        );
      }

      const updatedOccurrence = await tx.reminderOccurrence.findUniqueOrThrow({
        where: { id: occurrence.id },
      });

      const receipt = {
        schemaVersion: 1,
        operationId: updatedOccurrence.id,
        identityId: updatedOccurrence.identityId,
        source: updatedOccurrence.source,
        occurrenceKey: updatedOccurrence.occurrenceKey,
        idempotencyKey: updatedOccurrence.idempotencyKey,
        status: finalStatus,
        attempt: updatedOccurrence.attempt,
        lease: null,
        lastError: updatedOccurrence.lastError,
        nextRetryAt: null,
        deadLetterAt: null,
        correlationId: updatedOccurrence.correlationId,
        causationId: updatedOccurrence.causationId,
        attemptsHistory: [],
        createdAt: updatedOccurrence.createdAt.toISOString(),
        updatedAt: updatedOccurrence.updatedAt.toISOString(),
        finishedAt: now.toISOString(),
      };

      return assertValidBusinessOperationReceipt(receipt);
    });
  }
}
