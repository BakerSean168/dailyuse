import type { PrismaClient } from '@memoflow/database';
import type {
  PendingTaskGoalOutboxEvent,
  TaskGoalOutboxDispatchStore,
} from '../../../application/outbox/task-goal-outbox-dispatcher';
import {
  normalizeClaimLimit,
  resolveTaskGoalOutboxDispatchStoreOptions,
  retryAvailableAt,
  type ResolvedTaskGoalOutboxDispatchStoreOptions,
  type TaskGoalOutboxDispatchStoreOptions,
} from '../../task-goal-outbox-dispatch-policy';

interface ClaimedPrismaOutboxRow {
  eventId: string;
  payload: string;
}

/** PostgreSQL adapter using row locks so multiple dispatchers can claim safely. */
export class PrismaTaskGoalOutboxDispatchStore implements TaskGoalOutboxDispatchStore {
  private readonly options: ResolvedTaskGoalOutboxDispatchStoreOptions;

  constructor(
    private readonly prisma: PrismaClient,
    options: TaskGoalOutboxDispatchStoreOptions = {},
  ) {
    this.options = resolveTaskGoalOutboxDispatchStoreOptions(options);
  }

  async claimPending(limit: number): Promise<PendingTaskGoalOutboxEvent[]> {
    const claimLimit = normalizeClaimLimit(limit);
    if (claimLimit === 0) return [];

    const now = this.options.now();
    const leaseUntil = new Date(now.getTime() + this.options.processingLeaseMs);
    const claimed = await this.prisma.$queryRaw<ClaimedPrismaOutboxRow[]>`
      WITH candidates AS (
        SELECT event_id
          FROM task_goal_outbox
         WHERE status IN ('PENDING', 'PROCESSING')
           AND available_at <= ${now}
         ORDER BY available_at ASC, created_at ASC
         FOR UPDATE SKIP LOCKED
         LIMIT ${claimLimit}
      )
      UPDATE task_goal_outbox AS outbox
         SET status = 'PROCESSING',
             available_at = ${leaseUntil},
             updated_at = ${now}
        FROM candidates
       WHERE outbox.event_id = candidates.event_id
      RETURNING outbox.event_id AS "eventId", outbox.payload
    `;

    return claimed.map((row) => ({
      eventId: row.eventId,
      payload: row.payload,
    }));
  }

  async markDelivered(eventId: string): Promise<void> {
    const now = this.options.now();
    await this.prisma.taskGoalOutbox.updateMany({
      where: { eventId, status: 'PROCESSING' },
      data: {
        status: 'DELIVERED',
        dispatchedAt: now,
        lastError: null,
        updatedAt: now,
      },
    });
  }

  async markRetry(eventId: string, error: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const row = await tx.taskGoalOutbox.findUnique({
        where: { eventId },
        select: { attempts: true, status: true },
      });
      if (!row || row.status !== 'PROCESSING') return;

      const now = this.options.now();
      const nextAttempts = row.attempts + 1;
      const deadLetter = nextAttempts >= this.options.maxAttempts;
      await tx.taskGoalOutbox.updateMany({
        where: {
          eventId,
          status: 'PROCESSING',
          attempts: row.attempts,
        },
        data: {
          status: deadLetter ? 'DEAD_LETTER' : 'PENDING',
          attempts: { increment: 1 },
          lastError: error,
          availableAt: deadLetter ? now : retryAvailableAt(now, row.attempts, this.options),
          updatedAt: now,
        },
      });
    });
  }

  async replayDeadLetter(eventId: string): Promise<boolean> {
    const now = this.options.now();
    const result = await this.prisma.taskGoalOutbox.updateMany({
      where: { eventId, status: 'DEAD_LETTER' },
      data: {
        status: 'PENDING',
        attempts: 0,
        availableAt: now,
        lastError: null,
        dispatchedAt: null,
        updatedAt: now,
      },
    });
    return result.count === 1;
  }
}
