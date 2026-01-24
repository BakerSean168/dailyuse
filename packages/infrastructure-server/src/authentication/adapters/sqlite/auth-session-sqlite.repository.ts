/**
 * SQLite AuthSession Repository Implementation
 * 璁よ瘉浼氳瘽鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { AuthSession } from '@dailyuse/domain-server/authentication';
import type { IAuthSessionRepository } from '@dailyuse/domain-server/authentication';

export class SqliteAuthSessionRepository implements IAuthSessionRepository {
  constructor(private db: Database.Database) {}

  async save(session: AuthSession): Promise<void> {
    const dto = session.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO auth_sessions (
        uuid, accountUuid, access_token, refresh_token, token_expires_at,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        access_token = excluded.access_token,
        refresh_token = excluded.refresh_token,
        token_expires_at = excluded.token_expires_at,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,
      dto.access_token,
      dto.refresh_token,
      dto.token_expires_at,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findByUuid(uuid: string): Promise<AuthSession | null> {
    const stmt = this.db.prepare(`SELECT * FROM auth_sessions WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return AuthSession.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      access_token: row.access_token,
      refresh_token: row.refresh_token,
      token_expires_at: row.token_expires_at,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<AuthSession[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM auth_sessions WHERE accountUuid = ? ORDER BY createdAt DESC`
    );
    const rows = stmt.all(accountUuid) as any[];

    return rows.map((row) =>
      AuthSession.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row.accountUuid,
        access_token: row.access_token,
        refresh_token: row.refresh_token,
        token_expires_at: row.token_expires_at,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })
    );
  }

  async findByAccessToken(accessToken: string): Promise<AuthSession | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM auth_sessions WHERE access_token = ? LIMIT 1`
    );
    const row = stmt.get(accessToken) as any;

    if (!row) return null;

    return AuthSession.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      access_token: row.access_token,
      refresh_token: row.refresh_token,
      token_expires_at: row.token_expires_at,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async findByRefreshToken(refreshToken: string): Promise<AuthSession | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM auth_sessions WHERE refresh_token = ? LIMIT 1`
    );
    const row = stmt.get(refreshToken) as any;

    if (!row) return null;

    return AuthSession.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.accountUuid,
      access_token: row.access_token,
      refresh_token: row.refresh_token,
      token_expires_at: row.token_expires_at,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM auth_sessions WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async deleteByAccountUuid(accountUuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM auth_sessions WHERE accountUuid = ?`);
    stmt.run(accountUuid);
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM auth_sessions WHERE uuid = ? LIMIT 1`);
    return stmt.get(uuid) !== undefined;
  }
}

