import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import type { IElectronDatabase, IElectronDatabaseQueryResult } from '@memoflow/contracts/electron';
import { buildIdempotencyKeyString } from '@memoflow/contracts/reliable-messaging';
import {
  NotificationCategory,
  NotificationChannelType,
  NotificationRequestedSchema,
  NotificationType,
  RelatedEntityType,
} from '@memoflow/contracts/notification';
import { PowerSyncNotificationReliableAdapter } from '../power-sync-notification-reliable.adapter';

function createTestSqliteDatabase(): IElectronDatabase {
  const sqlite = new Database(':memory:');
  const wrapper: IElectronDatabase = {
    async execute(sql: string, parameters?: unknown[]): Promise<IElectronDatabaseQueryResult> {
      const info = sqlite.prepare(sql).run(...(parameters ?? []));
      return { rowsAffected: info.changes };
    },
    async getAll<T>(sql: string, parameters?: unknown[]): Promise<T[]> {
      return sqlite.prepare(sql).all(...(parameters ?? [])) as T[];
    },
    async getOptional<T>(sql: string, parameters?: unknown[]): Promise<T | null> {
      const row = sqlite.prepare(sql).get(...(parameters ?? []));
      return (row as T) ?? null;
    },
    async get<T>(sql: string, parameters?: unknown[]): Promise<T> {
      const row = sqlite.prepare(sql).get(...(parameters ?? []));
      if (!row) throw new Error(`Query returned no rows: ${sql}`);
      return row as T;
    },
    async writeTransaction<T>(callback: (tx: unknown) => Promise<T>): Promise<T> {
      sqlite.exec('BEGIN');
      try {
        const result = await callback(wrapper);
        sqlite.exec('COMMIT');
        return result;
      } catch (err) {
        sqlite.exec('ROLLBACK');
        throw err;
      }
    },
  };
  return wrapper;
}

const IDENTITY_ID = 'IdentityId_goal-owner';
const OCCURRENCE_KEY = 'GoalId_goal-1|2026-08-10T08:45:00.000Z';
const OPERATION_ID = `goal-reminder:${OCCURRENCE_KEY}`;
const SOURCE = 'goal-reminder';

function makeInput(overrides: { operationId?: string; occurrenceKey?: string } = {}) {
  const occurrenceKey = overrides.occurrenceKey ?? OCCURRENCE_KEY;
  const envelope = NotificationRequestedSchema.parse({
    identityId: IDENTITY_ID,
    source: SOURCE,
    occurrenceKey,
    idempotencyKey: buildIdempotencyKeyString({ identityId: IDENTITY_ID, source: SOURCE, occurrenceKey }),
    workflowKey: 'goal.reminder',
    topic: 'goal.reminder',
    relatedEntity: { type: RelatedEntityType.Goal, id: 'GoalId_goal-1' },
    content: {
      type: NotificationType.Reminder,
      category: NotificationCategory.Goal,
      title: '目标提醒：Ship R06',
      content: '目标「Ship R06」距离截止还有 3 天。',
    },
    suggestedChannels: [NotificationChannelType.InApp, NotificationChannelType.Push],
    correlationId: occurrenceKey,
  });
  return {
    operationId: overrides.operationId ?? OPERATION_ID,
    envelope,
  };
}

describe('PowerSyncNotificationReliableAdapter.enqueueNotificationRequested', () => {
  it('persists a pending notification.requested shared-outbox row and returns its receipt', async () => {
    const adapter = new PowerSyncNotificationReliableAdapter(createTestSqliteDatabase());
    const input = makeInput();

    const receipt = await adapter.enqueueNotificationRequested(input);

    expect(receipt).toMatchObject({
      schemaVersion: 1,
      operationId: OPERATION_ID,
      identityId: IDENTITY_ID,
      source: SOURCE,
      occurrenceKey: OCCURRENCE_KEY,
      idempotencyKey: buildIdempotencyKeyString({
        identityId: IDENTITY_ID,
        source: SOURCE,
        occurrenceKey: OCCURRENCE_KEY,
      }),
      status: 'pending',
      attempt: 0,
      lease: null,
      finishedAt: null,
    });
    expect(receipt.correlationId).toBe(OCCURRENCE_KEY);

    const rows = await adapter.claimSharedOutboxIntents({ ownerToken: 'owner-1', limit: 50 });
    const matched = rows.filter(
      (row) => row.id === OPERATION_ID && row.identityId === IDENTITY_ID,
    );
    expect(matched).toHaveLength(1);
    expect(matched[0]).toMatchObject({
      id: OPERATION_ID,
      messageType: 'notification.requested',
      schemaVersion: 1,
      status: 'running',
      attempts: 1,
      ownerToken: 'owner-1',
    });
    expect(matched[0].claimId).toBeTruthy();
    expect(matched[0].leaseExpiresAt).toBeTruthy();
  });

  it('is idempotent: re-enqueue by operationId returns the same row without a duplicate', async () => {
    const adapter = new PowerSyncNotificationReliableAdapter(createTestSqliteDatabase());
    const input = makeInput();

    const first = await adapter.enqueueNotificationRequested(input);
    const second = await adapter.enqueueNotificationRequested(input);

    expect(second.operationId).toBe(OPERATION_ID);
    expect(second.idempotencyKey).toBe(first.idempotencyKey);
    expect(second.status).toBe('pending');

    const rows = await adapter.claimSharedOutboxIntents({ ownerToken: 'owner-1', limit: 50 });
    expect(rows.filter((row) => row.id === OPERATION_ID)).toHaveLength(1);
  });

  it('reconciles to the existing row when the idempotencyKey already exists under another operationId', async () => {
    const adapter = new PowerSyncNotificationReliableAdapter(createTestSqliteDatabase());
    const input = makeInput();
    await adapter.enqueueNotificationRequested(input);

    const receipt = await adapter.enqueueNotificationRequested(
      makeInput({ operationId: `goal-reminder-stale:${OCCURRENCE_KEY}` }),
    );

    expect(receipt.operationId).toBe(OPERATION_ID);
    const rows = await adapter.claimSharedOutboxIntents({ ownerToken: 'owner-1', limit: 50 });
    expect(rows.filter((row) => row.idempotencyKey === input.envelope.idempotencyKey)).toHaveLength(1);
  });

  it('rejects an envelope whose idempotencyKey does not match its identity triple', async () => {
    const adapter = new PowerSyncNotificationReliableAdapter(createTestSqliteDatabase());
    const badEnvelope = NotificationRequestedSchema.safeParse({
      ...makeInput().envelope,
      idempotencyKey: 'v1:9:IdentityId_goal-owner:14:goal-reminder:40:WRONG',
    });

    expect(badEnvelope.success).toBe(false);
    await expect(
      adapter.enqueueNotificationRequested({ operationId: OPERATION_ID, envelope: {} as never }),
    ).rejects.toThrow();
  });
});