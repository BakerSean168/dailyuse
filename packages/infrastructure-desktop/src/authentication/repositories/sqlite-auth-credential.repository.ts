/**
 * SQLite AuthCredential Repository Implementation
 * 认证凭证的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { AuthCredential } from '@dailyuse/domain-server/authentication';
import type { IAuthCredentialRepository } from '@dailyuse/domain-server/authentication';

export class SqliteAuthCredentialRepository implements IAuthCredentialRepository {
  constructor(private db: Database.Database) {}

  async save(credential: AuthCredential): Promise<void> {
    const dto = credential.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO auth_credentials (
        uuid, account_uuid, credential_type, credential_value, is_verified,
        verified_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        credential_type = excluded.credential_type,
        credential_value = excluded.credential_value,
        is_verified = excluded.is_verified,
        verified_at = excluded.verified_at,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.account_uuid,
      dto.credential_type,
      dto.credential_value,
      dto.is_verified ? 1 : 0,
      dto.verified_at ? dto.verified_at.getTime() : null,
      dto.created_at,
      dto.updated_at,
    );
  }

  async findByUuid(uuid: string): Promise<AuthCredential | null> {
    const stmt = this.db.prepare(`SELECT * FROM auth_credentials WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return AuthCredential.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      credential_type: row.credential_type,
      credential_value: row.credential_value,
      is_verified: row.is_verified === 1,
      verified_at: row.verified_at ? new Date(row.verified_at) : null,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<AuthCredential | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM auth_credentials WHERE account_uuid = ? ORDER BY created_at DESC LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return AuthCredential.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      credential_type: row.credential_type,
      credential_value: row.credential_value,
      is_verified: row.is_verified === 1,
      verified_at: row.verified_at ? new Date(row.verified_at) : null,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findAll(params?: { skip?: number; take?: number }): Promise<AuthCredential[]> {
    let query = `SELECT * FROM auth_credentials ORDER BY created_at DESC`;
    const parameters: any[] = [];

    if (params?.skip) {
      query += ` OFFSET ?`;
      parameters.push(params.skip);
    }

    if (params?.take) {
      query += ` LIMIT ?`;
      parameters.push(params.take);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...parameters) as any[];

    return rows.map((row) =>
      AuthCredential.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        credential_type: row.credential_type,
        credential_value: row.credential_value,
        is_verified: row.is_verified === 1,
        verified_at: row.verified_at ? new Date(row.verified_at) : null,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async findByStatus(isVerified: boolean): Promise<AuthCredential[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM auth_credentials WHERE is_verified = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(isVerified ? 1 : 0) as any[];

    return rows.map((row) =>
      AuthCredential.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.account_uuid,
        credential_type: row.credential_type,
        credential_value: row.credential_value,
        is_verified: row.is_verified === 1,
        verified_at: row.verified_at ? new Date(row.verified_at) : null,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM auth_credentials WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async deleteByAccountUuid(accountUuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM auth_credentials WHERE account_uuid = ?`);
    stmt.run(accountUuid);
  }
}
