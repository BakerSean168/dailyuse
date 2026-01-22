/**
 * SQLite Account Repository Implementation
 * 账户的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { Account } from '@dailyuse/domain-server/account';
import type { IAccountRepository } from '@dailyuse/domain-server/account';

export class SqliteAccountRepository implements IAccountRepository {
  constructor(private db: Database.Database) {}

  async save(account: Account): Promise<void> {
    const dto = account.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO accounts (
        uuid, username, email, phone_number, display_name, avatar_url,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        username = excluded.username,
        email = excluded.email,
        phone_number = excluded.phone_number,
        display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        status = excluded.status,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.username,
      dto.email,
      dto.phone_number || null,
      dto.display_name || null,
      dto.avatar_url || null,
      dto.status,
      dto.created_at,
      dto.updated_at,
    );
  }

  async findById(uuid: string): Promise<Account | null> {
    const stmt = this.db.prepare(`SELECT * FROM accounts WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return Account.fromPersistenceDTO({
      uuid: row.uuid,
      username: row.username,
      email: row.email,
      phone_number: row.phone_number,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
      status: row.status,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByUsername(username: string): Promise<Account | null> {
    const stmt = this.db.prepare(`SELECT * FROM accounts WHERE username = ? LIMIT 1`);
    const row = stmt.get(username) as any;

    if (!row) return null;

    return Account.fromPersistenceDTO({
      uuid: row.uuid,
      username: row.username,
      email: row.email,
      phone_number: row.phone_number,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
      status: row.status,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByEmail(email: string): Promise<Account | null> {
    const stmt = this.db.prepare(`SELECT * FROM accounts WHERE email = ? LIMIT 1`);
    const row = stmt.get(email) as any;

    if (!row) return null;

    return Account.fromPersistenceDTO({
      uuid: row.uuid,
      username: row.username,
      email: row.email,
      phone_number: row.phone_number,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
      status: row.status,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Account | null> {
    const stmt = this.db.prepare(`SELECT * FROM accounts WHERE phone_number = ? LIMIT 1`);
    const row = stmt.get(phoneNumber) as any;

    if (!row) return null;

    return Account.fromPersistenceDTO({
      uuid: row.uuid,
      username: row.username,
      email: row.email,
      phone_number: row.phone_number,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
      status: row.status,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM accounts WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async softDelete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(
      `UPDATE accounts SET status = 'DELETED', updated_at = ? WHERE uuid = ?`
    );
    stmt.run(Date.now(), uuid);
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM accounts WHERE uuid = ? LIMIT 1`);
    return stmt.get(uuid) !== undefined;
  }
}
