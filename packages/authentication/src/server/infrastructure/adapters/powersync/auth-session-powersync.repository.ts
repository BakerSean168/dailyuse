import type { IElectronDatabase, IElectronDatabaseTransaction } from '@memoflow/contracts/electron';
import type { IAuthSessionRepository } from '../../../domain';
import { AuthSession } from '../../../domain';
import { AggregateRepositoryBase, createEventBusAdapter } from '@memoflow/patterns';
import { eventBus } from '@memoflow/utils/domain';
import {
  PowerSyncAuthSessionMapper,
  type PowerSyncAuthSessionRow,
  type PowerSyncAuthSessionWriteData,
} from './mappers/powersync-auth-session.mapper';

const eventBusAdapter = createEventBusAdapter(eventBus);

export class PowerSyncAuthSessionRepository
  extends AggregateRepositoryBase<AuthSession>
  implements IAuthSessionRepository
{
  constructor(private readonly db: IElectronDatabase) {
    super(eventBusAdapter);
  }

  protected async persist(session: AuthSession): Promise<void> {
    const d = PowerSyncAuthSessionMapper.toPersistence(session);

    await this.db.writeTransaction(async (tx) => {
      const existing = await tx.getOptional<{ id: string }>(
        `SELECT id FROM auth_sessions WHERE id = ? LIMIT 1`,
        [d.id],
      );

      if (existing) {
        await this.updateRow(tx, d);
        return;
      }

      try {
        await this.insertRow(tx, d);
      } catch (error) {
        if (!isUniqueConstraintError(error)) {
          throw error;
        }

        // PowerSync-backed views do not support UPSERT. When the view already
        // exposes the row, fall back to a plain UPDATE instead of failing login.
        await this.updateRow(tx, d);
      }
    });
  }

  async findById(id: string): Promise<AuthSession | null> {
    const row = await this.db.getOptional<PowerSyncAuthSessionRow>(
      `SELECT * FROM auth_sessions WHERE id = ? LIMIT 1`,
      [id],
    );
    if (!row) return null;
    return PowerSyncAuthSessionMapper.toDomain(row);
  }

  async findByIdForIdentity(identityId: string, id: string): Promise<AuthSession | null> {
    const row = await this.db.getOptional<PowerSyncAuthSessionRow>(
      `SELECT * FROM auth_sessions WHERE id = ? AND identity_id = ? LIMIT 1`,
      [id, identityId],
    );
    if (!row) return null;
    return PowerSyncAuthSessionMapper.toDomain(row);
  }

  async findByIdentityId(identityId: string): Promise<AuthSession[]> {
    const rows = await this.db.getAll<PowerSyncAuthSessionRow>(
      `SELECT * FROM auth_sessions WHERE identity_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
      [identityId],
    );
    return rows.map((row) => PowerSyncAuthSessionMapper.toDomain(row));
  }

  async remove(session: AuthSession): Promise<void> {
    await this.db.execute(`UPDATE auth_sessions SET deleted_at = ? WHERE id = ?`, [
      new Date().toISOString(),
      session.id,
    ]);
  }

  async removeAllByIdentityId(identityId: string): Promise<void> {
    await this.db.execute(
      `UPDATE auth_sessions SET deleted_at = ? WHERE identity_id = ? AND deleted_at IS NULL`,
      [new Date().toISOString(), identityId],
    );
  }

  async removeExpired(): Promise<void> {
    await this.db.execute(
      `UPDATE auth_sessions SET deleted_at = ? WHERE expires_at < ? AND deleted_at IS NULL`,
      [new Date().toISOString(), new Date().toISOString()],
    );
  }

  private async updateRow(
    tx: IElectronDatabaseTransaction,
    d: PowerSyncAuthSessionWriteData,
  ): Promise<void> {
    await tx.execute(
      `UPDATE auth_sessions
       SET identity_id = ?,
           refresh_token_hash = ?,
           device_id = ?,
           device_fingerprint = ?,
           device_type = ?,
           device_name = ?,
           os = ?,
           browser = ?,
           ip_address = ?,
           location = ?,
           version = ?,
           created_at = ?,
           expires_at = ?,
           last_active_at = ?,
           deleted_at = ?
       WHERE id = ?`,
      [
        d.identity_id,
        d.refresh_token_hash,
        d.device_id,
        d.device_fingerprint,
        d.device_type,
        d.device_name,
        d.os,
        d.browser,
        d.ip_address,
        d.location,
        d.version,
        d.created_at,
        d.expires_at,
        d.last_active_at,
        d.deleted_at,
        d.id,
      ],
    );
  }

  private async insertRow(
    tx: IElectronDatabaseTransaction,
    d: PowerSyncAuthSessionWriteData,
  ): Promise<void> {
    await tx.execute(
      `INSERT INTO auth_sessions (
         id, identity_id, refresh_token_hash, device_id, device_fingerprint, device_type,
         device_name, os, browser, ip_address, location, version,
         created_at, expires_at, last_active_at, deleted_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d.id,
        d.identity_id,
        d.refresh_token_hash,
        d.device_id,
        d.device_fingerprint,
        d.device_type,
        d.device_name,
        d.os,
        d.browser,
        d.ip_address,
        d.location,
        d.version,
        d.created_at,
        d.expires_at,
        d.last_active_at,
        d.deleted_at,
      ],
    );
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Error && /unique constraint failed/i.test(error.message);
}
