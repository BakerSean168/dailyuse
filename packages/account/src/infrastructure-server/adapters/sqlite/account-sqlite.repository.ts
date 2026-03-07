import type Database from 'better-sqlite3';
import type { IAccountRepository } from '../../../domain-server';
import { Account } from '../../../domain-server';
import { eventBus } from '@dailyuse/utils';
import { AccountSqliteMapper } from './mappers/account-sqlite.mapper';

export type AccountRow = {
  id: string;
  username: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  locale: string | null;
  timezone: string | null;
  status: string | null;
  created_at: number;
  updated_at: number;
};

export class SqliteAccountRepository implements IAccountRepository {
  constructor(private readonly db: Database.Database) {}

  async save(account: Account, _tx?: unknown): Promise<void> {
    this.db
      .prepare(
        `
      INSERT INTO accounts (
        id,
        username,
        email,
        display_name,
        avatar_url,
        locale,
        timezone,
        status,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @username,
        @email,
        @display_name,
        @avatar_url,
        @locale,
        @timezone,
        @status,
        @created_at,
        @updated_at
      )
      ON CONFLICT(id) DO UPDATE SET
        username = excluded.username,
        email = excluded.email,
        display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        locale = excluded.locale,
        timezone = excluded.timezone,
        status = excluded.status,
        updated_at = excluded.updated_at
      `,
      )
      .run(this.toRowParams(account));

    const domainEvents = account.pullDomainEvents();
    for (const evt of domainEvents) {
      eventBus.send(evt.eventType as any, evt.payload as any);
    }
  }

  async findById(id: string, _tx?: unknown): Promise<Account | null> {
    const row = this.db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as
      | AccountRow
      | undefined;
    return row ? AccountSqliteMapper.toDomain(row) : null;
  }

  async findByUsername(username: string, _tx?: unknown): Promise<Account | null> {
    const row = this.db.prepare('SELECT * FROM accounts WHERE username = ?').get(username) as
      | AccountRow
      | undefined;
    return row ? AccountSqliteMapper.toDomain(row) : null;
  }

  async findByEmail(email: string, _tx?: unknown): Promise<Account | null> {
    const row = this.db.prepare('SELECT * FROM accounts WHERE email = ?').get(email) as
      | AccountRow
      | undefined;
    return row ? AccountSqliteMapper.toDomain(row) : null;
  }

  async findByPhone(_phoneNumber: string, _tx?: unknown): Promise<Account | null> {
    return null;
  }

  async existsByUsername(username: string, _tx?: unknown): Promise<boolean> {
    const row = this.db.prepare('SELECT 1 FROM accounts WHERE username = ? LIMIT 1').get(username);
    return !!row;
  }

  async existsByEmail(email: string, _tx?: unknown): Promise<boolean> {
    const row = this.db.prepare('SELECT 1 FROM accounts WHERE email = ? LIMIT 1').get(email);
    return !!row;
  }

  async delete(id: string, _tx?: unknown): Promise<void> {
    this.db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
  }

  async findAll(
    options?: {
      page?: number;
      pageSize?: number;
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
    },
    _tx?: unknown,
  ): Promise<{ accounts: Account[]; total: number }> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    const hasStatus = !!options?.status;
    const status = this.mapStatusFilter(options?.status);

    const totalRow = hasStatus
      ? (this.db.prepare('SELECT COUNT(*) as count FROM accounts WHERE status = ?').get(status) as {
          count: number;
        })
      : (this.db.prepare('SELECT COUNT(*) as count FROM accounts').get() as { count: number });

    const rows = hasStatus
      ? (this.db
          .prepare(
            'SELECT * FROM accounts WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
          )
          .all(status, pageSize, offset) as AccountRow[])
      : (this.db
          .prepare('SELECT * FROM accounts ORDER BY created_at DESC LIMIT ? OFFSET ?')
          .all(pageSize, offset) as AccountRow[]);

    return {
      accounts: rows.map((row) => AccountSqliteMapper.toDomain(row)),
      total: totalRow.count,
    };
  }

  private toRowParams(account: Account): {
    id: string;
    username: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    locale: string;
    timezone: string;
    status: string;
    created_at: number;
    updated_at: number;
  } {
    const profileDTO = account.profile.toPersistenceDTO();
    const settingsDTO = account.settings.toPersistenceDTO();
    return {
      id: account.id.toString(),
      username: this.buildUsername(account),
      email: account.email.address,
      display_name: profileDTO.realName ?? profileDTO.nickname,
      avatar_url: profileDTO.avatarUrl,
      locale: settingsDTO.language,
      timezone: settingsDTO.timezone,
      status: this.mapStatusFilter(account.status.toString() as any),
      created_at: account.createdAt.getTime(),
      updated_at: account.updatedAt.getTime(),
    };
  }

  private buildUsername(account: Account): string {
    const preferred = account.profile.nickname?.trim();
    if (preferred && preferred.length >= 2) {
      return preferred.slice(0, 20);
    }

    const fromEmail = account.email.address.split('@')[0]?.trim();
    if (fromEmail && fromEmail.length >= 2) {
      return fromEmail.slice(0, 20);
    }

    const fallback = `u_${account.id
      .toString()
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 18)}`;
    return fallback.length >= 2 ? fallback : `u_${Date.now()}`;
  }

  private mapStatusFilter(
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED' | undefined,
  ): string {
    if (status === 'SUSPENDED') {
      return 'SUSPENDED';
    }
    if (status === 'INACTIVE' || status === 'DELETED') {
      return 'DEACTIVATED';
    }
    return 'ACTIVE';
  }
}

export { SqliteAccountRepository as ElectronAccountRepository };
