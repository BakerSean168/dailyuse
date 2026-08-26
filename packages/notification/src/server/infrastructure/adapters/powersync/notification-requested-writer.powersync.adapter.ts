/**
 * NotificationRequestedPowerSyncWriterAdapter - PowerSync / SQLite implementation
 * of the notification-requested writer port (NOTIF-3301 durable envelope).
 *
 * Desktop lane counterpart of NotificationRequestedPrismaWriterAdapter: business
 * handlers enqueue a `NotificationRequested` envelope into the SHARED
 * `outbox_messages` table that the desktop durable runtime claims via
 * `claimSharedOutboxIntents` and materializes into the Notification Fact +
 * per-channel delivery plan. The write never reaches into any channel
 * deliverer, so a handler commit never depends on external Desktop/Email/Push
 * delivery success.
 *
 * Idempotency semantics mirror the Prisma writer exactly: the durable dedupe
 * anchor is the canonical `idempotencyKey` (not the operationId), so a
 * crash/replay retry carrying the same envelope collapses onto the existing row.
 */

import type { IElectronDatabase } from '@memoflow/contracts/electron';
import {
  type NotificationRequestedOutboxInput,
  NotificationRequestedOutboxInputSchema,
  type NotificationRequestedWriterPort,
  NOTIFICATION_REQUESTED_MESSAGE_TYPE,
} from '@memoflow/contracts/notification';
import type { BusinessOperationReceipt } from '@memoflow/contracts/reliable-messaging';
import { mapPrismaSharedOutboxToReceipt } from '../prisma/notification-requested-writer.prisma.adapter';
import {
  mapPowerSyncSharedOutboxToOutboxMessage,
  type PowerSyncSharedOutboxRow,
} from './power-sync-notification-reliable.adapter';

export class NotificationRequestedPowerSyncWriterAdapter implements NotificationRequestedWriterPort {
  private tableInitialized = false;

  constructor(private readonly db: IElectronDatabase) {}

  private async ensureTablesExist(): Promise<void> {
    if (this.tableInitialized) return;
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS outbox_messages (
        id TEXT PRIMARY KEY,
        aggregate_type TEXT NOT NULL DEFAULT 'shared',
        aggregate_id TEXT NOT NULL DEFAULT 'shared',
        message_type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        status TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        owner_token TEXT,
        claim_id TEXT,
        fencing_token INTEGER NOT NULL DEFAULT 0,
        lease_expires_at TEXT,
        last_heartbeat_at TEXT,
        last_error TEXT,
        next_retry_at TEXT,
        identity_id TEXT,
        idempotency_key TEXT UNIQUE,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        correlation_id TEXT NOT NULL DEFAULT '',
        causation_id TEXT,
        schema_version INTEGER NOT NULL DEFAULT 1,
        dispatched_at TEXT
      );
    `);
    await this.db.execute(
      `CREATE INDEX IF NOT EXISTS idx_om_message_type ON outbox_messages(message_type);`,
    );
    await this.db.execute(
      `CREATE INDEX IF NOT EXISTS idx_om_status ON outbox_messages(status);`,
    );
    this.tableInitialized = true;
  }

  private async fetchById(id: string): Promise<PowerSyncSharedOutboxRow | null> {
    return this.db.getOptional<PowerSyncSharedOutboxRow>(
      `SELECT * FROM outbox_messages WHERE id = ? LIMIT 1`,
      [id],
    );
  }

  private async fetchByIdempotencyKey(idempotencyKey: string): Promise<PowerSyncSharedOutboxRow | null> {
    return this.db.getOptional<PowerSyncSharedOutboxRow>(
      `SELECT * FROM outbox_messages WHERE idempotency_key = ? LIMIT 1`,
      [idempotencyKey],
    );
  }

  private mapToReceipt(row: PowerSyncSharedOutboxRow): BusinessOperationReceipt {
    return mapPrismaSharedOutboxToReceipt(mapPowerSyncSharedOutboxToOutboxMessage(row));
  }

  async enqueueNotificationRequested(
    input: NotificationRequestedOutboxInput,
  ): Promise<BusinessOperationReceipt> {
    const validated = NotificationRequestedOutboxInputSchema.parse(input);
    await this.ensureTablesExist();

    // Deterministic operationId anchor: a full replay of the same handler
    // execution must resolve to the durable row it created before.
    const existingById = await this.fetchById(validated.operationId);
    if (existingById) {
      return this.mapToReceipt(existingById);
    }

    // Envelope-level idempotency: the canonical idempotencyKey (NOT the
    // operationId) is the durable dedupe anchor.
    const existingByIdempotencyKey = await this.fetchByIdempotencyKey(validated.envelope.idempotencyKey);
    if (existingByIdempotencyKey) {
      return this.mapToReceipt(existingByIdempotencyKey);
    }

    const now = new Date().toISOString();
    const envelope = validated.envelope;
    const correlationId = envelope.correlationId ?? validated.correlationId ?? validated.operationId;
    const causationId = envelope.causationId ?? validated.causationId ?? null;

    try {
      await this.db.execute(
        `INSERT INTO outbox_messages (
          id, aggregate_type, aggregate_id, message_type, payload_json,
          status, attempts, identity_id, idempotency_key, created_at,
          updated_at, correlation_id, causation_id, schema_version
        ) VALUES (?, 'shared', 'shared', ?, ?, 'pending', 0, ?, ?, ?, ?, ?, ?, 1)`,
        [
          validated.operationId,
          NOTIFICATION_REQUESTED_MESSAGE_TYPE,
          JSON.stringify(envelope),
          envelope.identityId,
          envelope.idempotencyKey,
          now,
          now,
          correlationId,
          causationId,
        ],
      );

      const created = await this.fetchById(validated.operationId);
      if (!created) {
        throw new Error(
          `[FAIL-FAST] Shared outbox row '${validated.operationId}' was not readable after INSERT.`,
        );
      }
      return this.mapToReceipt(created);
    } catch (cause) {
      // An idempotency-key collision means a concurrent winner created the
      // durable row first under either anchor; reconcile to the stable row.
      const reFetched =
        (await this.fetchById(validated.operationId)) ??
        (await this.fetchByIdempotencyKey(validated.envelope.idempotencyKey));
      if (!reFetched) throw cause;
      return this.mapToReceipt(reFetched);
    }
  }
}