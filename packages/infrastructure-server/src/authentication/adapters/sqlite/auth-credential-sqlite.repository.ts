/**
 * SQLite AuthCredential Repository Implementation
 * 璁よ瘉鍑瘉鐨?SQLite Repository瀹炵幇
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
        uuid, accountUuid, credential_type, credential_value, is_verified,
        verified_at, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        credential_type = excluded.credential_type,
        credential_value = excluded.credential_value,
        is_verified = excluded.is_verified,
        verified_at = excluded.verified_at,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,
      dto.credential_type,
      dto.credential_value,
      dto.is_verified ? 1 : 0,
      dto.verified_at ? dto.verified_at.getTime() : null,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findByUuid(uuid: string): Promise<AuthCredential | null> {
    const stmt = this.db.prepare(`SELECT * FROM auth_credentials WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return AuthCredential.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      credential_type: row.credential_type,
      credential_value: row.credential_value,
      is_verified: row.is_verified === 1,
      verified_at: row.verified_at ? new Date(row.verified_at) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<AuthCredential | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM auth_credentials WHERE accountUuid = ? ORDER BY createdAt DESC LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return AuthCredential.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      credential_type: row.credential_type,
      credential_value: row.credential_value,
      is_verified: row.is_verified === 1,
      verified_at: row.verified_at ? new Date(row.verified_at) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findAll(params?: { skip?: number; take?: number }): Promise<AuthCredential[]> {
    let query = `SELECT * FROM auth_credentials ORDER BY createdAt DESC`;
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
        account_uuid: row.accountUuid,
        credential_type: row.credential_type,
        credential_value: row.credential_value,
        is_verified: row.is_verified === 1,
        verified_at: row.verified_at ? new Date(row.verified_at) : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findByStatus(
    status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED',
    params?: { skip?: number; take?: number },
  ): Promise<AuthCredential[]> {
    // Map status to is_verified field (simplified mapping for now)
    // ACTIVE = is_verified true, others = is_verified false
    const isVerified = status === 'ACTIVE' ? 1 : 0;
    
    let query = `SELECT * FROM auth_credentials WHERE is_verified = ? ORDER BY createdAt DESC`;
    const parameters: any[] = [isVerified];

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
        account_uuid: row.accountUuid,
        credential_type: row.credential_type,
        credential_value: row.credential_value,
        is_verified: row.is_verified === 1,
        verified_at: row.verified_at ? new Date(row.verified_at) : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM auth_credentials WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async deleteByAccountUuid(accountUuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM auth_credentials WHERE accountUuid = ?`);
    stmt.run(accountUuid);
  }

  async findByType(
    type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY',
    params?: { skip?: number; take?: number },
  ): Promise<any[]> {
    let query = `SELECT * FROM auth_credentials WHERE credential_type = ? ORDER BY createdAt DESC`;
    const parameters: any[] = [type];

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
        account_uuid: row.accountUuid,
        credential_type: row.credential_type,
        credential_value: row.credential_value,
        is_verified: row.is_verified === 1,
        verified_at: row.verified_at ? new Date(row.verified_at) : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async existsByAccountUuid(accountUuid: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM auth_credentials WHERE accountUuid = ? LIMIT 1`
    );
    return stmt.get(accountUuid) !== undefined;
  }

  async deleteExpired(): Promise<number> {
    // For SQLite, we need to delete credentials with expired status in metadata
    // Since this is complex with JSON parsing, we'll delete credentials with expiresAt in the past
    const stmt = this.db.prepare(
      `DELETE FROM auth_credentials WHERE expiresAt IS NOT NULL AND expiresAt < ?`
    );
    const now = Date.now();
    const result = stmt.run(now);
    return result.changes;
  }
}

