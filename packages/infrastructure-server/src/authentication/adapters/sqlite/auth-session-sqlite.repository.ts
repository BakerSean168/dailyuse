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

  async deleteByAccountUuid(accountUuid: string): Promise<number> {
    const stmt = this.db.prepare(`DELETE FROM auth_sessions WHERE accountUuid = ?`);
    const result = stmt.run(accountUuid);
    return result.changes;
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM auth_sessions WHERE uuid = ? LIMIT 1`);
    return stmt.get(uuid) !== undefined;
  }

  async findByDeviceId(deviceId: string): Promise<AuthSession[]> {
    // For SQLite, we'll query all sessions and filter by deviceId in JSON
    // This is a simplified implementation
    const stmt = this.db.prepare(
      `SELECT * FROM auth_sessions ORDER BY createdAt DESC`
    );
    const rows = stmt.all() as any[];

    return rows
      .filter((row) => {
        try {
          const device = JSON.parse(row.device || '{}');
          return device.deviceId === deviceId;
        } catch {
          return false;
        }
      })
      .map((row) =>
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

  async findActiveSessions(accountUuid: string): Promise<AuthSession[]> {
    const now = Date.now();
    const stmt = this.db.prepare(
      `SELECT * FROM auth_sessions 
       WHERE accountUuid = ? AND status = 'ACTIVE' AND token_expires_at > ?
       ORDER BY updatedAt DESC`
    );
    const rows = stmt.all(accountUuid, now) as any[];

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

  async findActiveSessionsByAccountUuid(accountUuid: string): Promise<AuthSession[]> {
    return this.findActiveSessions(accountUuid);
  }

  async findAll(params?: { skip?: number; take?: number }): Promise<AuthSession[]> {
    let query = `SELECT * FROM auth_sessions ORDER BY createdAt DESC`;
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

  async findByStatus(
    status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOCKED',
    params?: { skip?: number; take?: number },
  ): Promise<AuthSession[]> {
    let query = `SELECT * FROM auth_sessions WHERE status = ? ORDER BY createdAt DESC`;
    const parameters: any[] = [status];

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

  async deleteExpired(): Promise<number> {
    const now = new Date().getTime();
    const stmt = this.db.prepare(
      `DELETE FROM auth_sessions WHERE status = 'EXPIRED' OR token_expires_at < ?`
    );
    const result = stmt.run(now);
    return result.changes;
  }
}

