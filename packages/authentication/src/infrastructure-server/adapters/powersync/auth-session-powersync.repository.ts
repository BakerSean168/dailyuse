import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { IAuthSessionRepository } from '../../../domain-server';
import { AuthSession } from '../../../domain-server';
import {
  PowerSyncAuthSessionMapper,
  type PowerSyncAuthSessionRow,
} from './mappers/powersync-auth-session.mapper';

export class PowerSyncAuthSessionRepository implements IAuthSessionRepository {
  constructor(private readonly db: IElectronDatabase) {}

  async save(session: AuthSession): Promise<void> {
    const d = PowerSyncAuthSessionMapper.toPersistence(session);

    const updateResult = await this.db.execute(
      `UPDATE auth_sessions
       SET refresh_token_hash = ?,
           device_name = ?,
           os = ?,
           browser = ?,
           ip_address = ?,
           location = ?,
           expires_at = ?,
           last_active_at = ?,
           deleted_at = ?
       WHERE id = ?`,
      [
        d.refresh_token_hash,
        d.device_name,
        d.os,
        d.browser,
        d.ip_address,
        d.location,
        d.expires_at,
        d.last_active_at,
        d.deleted_at,
        d.id,
      ],
    );

    if (updateResult.rowsAffected === 0) {
      await this.db.execute(
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

  async findById(id: string): Promise<AuthSession | null> {
    const row = await this.db.getOptional<PowerSyncAuthSessionRow>(
      `SELECT * FROM auth_sessions WHERE id = ? LIMIT 1`,
      [id],
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
}
