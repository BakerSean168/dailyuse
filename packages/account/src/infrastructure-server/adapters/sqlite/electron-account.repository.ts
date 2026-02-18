import type Database from 'better-sqlite3';
import type { IAccountRepository } from '../../../domain-server';
import { Account } from '../../../domain-server';
import type { AccountPersistenceDTO } from '@dailyuse/contracts/account';
import { createLogger, eventBus } from '@dailyuse/utils';

const logger = createLogger('ElectronAccountRepository');

type AccountRow = {
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

export class ElectronAccountRepository implements IAccountRepository {
  constructor(private readonly db: Database.Database) {}

  async save(account: Account, _tx?: unknown): Promise<void> {
    const dto = account.toPersistenceDTO();

    this.db.prepare(
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
    ).run(this.toRowParams(dto));

    const domainEvents = account.pullDomainEvents();
    for (const evt of domainEvents) {
      eventBus.send(evt.eventType as any, evt.payload as any);
    }
  }

  async findById(id: string, _tx?: unknown): Promise<Account | null> {
    const row = this.db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as AccountRow | undefined;
    return row ? this.mapToDomain(row) : null;
  }

  async findByUsername(username: string, _tx?: unknown): Promise<Account | null> {
    const row = this.db
      .prepare('SELECT * FROM accounts WHERE username = ?')
      .get(username) as AccountRow | undefined;
    return row ? this.mapToDomain(row) : null;
  }

  async findByEmail(email: string, _tx?: unknown): Promise<Account | null> {
    const row = this.db.prepare('SELECT * FROM accounts WHERE email = ?').get(email) as AccountRow | undefined;
    return row ? this.mapToDomain(row) : null;
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
          .prepare('SELECT * FROM accounts WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
          .all(status, pageSize, offset) as AccountRow[])
      : (this.db
          .prepare('SELECT * FROM accounts ORDER BY created_at DESC LIMIT ? OFFSET ?')
          .all(pageSize, offset) as AccountRow[]);

    return {
      accounts: rows.map((row) => this.mapToDomain(row)),
      total: totalRow.count,
    };
  }

  private toRowParams(dto: AccountPersistenceDTO): {
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
    return {
      id: dto.id,
      username: this.buildUsername(dto),
      email: dto.email.address,
      display_name: dto.profile.realName ?? dto.profile.nickname,
      avatar_url: dto.profile.avatarUrl,
      locale: dto.settings.language,
      timezone: dto.settings.timezone,
      status: this.normalizeStatus(dto.status),
      created_at: dto.createdAt.getTime(),
      updated_at: dto.updatedAt.getTime(),
    };
  }

  private mapToDomain(row: AccountRow): Account {
    const status = this.normalizeStatus(row.status);
    const email = row.email ?? `${row.id}@local.dailyuse`;

    const dto: AccountPersistenceDTO = {
      id: row.id,
      status,
      profile: {
        nickname: row.username,
        realName: row.display_name,
        avatarUrl: row.avatar_url,
        bio: null,
        gender: 'PREFER_NOT_TO_SAY',
        birthday: null,
      },
      settings: {
        theme: 'SYSTEM',
        language: (row.locale as any) || 'zh-CN',
        timezone: row.timezone || 'Asia/Shanghai',
        notificationEnabled: true,
      },
      email: {
        address: email,
        isVerified: false,
        verifiedAt: null,
        isPrimary: true,
      },
      phone: null,
      version: 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: null,
    };

    return Account.fromPersistenceDTO(dto);
  }

  private buildUsername(dto: AccountPersistenceDTO): string {
    const preferred = dto.profile.nickname?.trim();
    if (preferred && preferred.length >= 2) {
      return preferred.slice(0, 20);
    }

    const fromEmail = dto.email.address.split('@')[0]?.trim();
    if (fromEmail && fromEmail.length >= 2) {
      return fromEmail.slice(0, 20);
    }

    const fallback = `u_${dto.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 18)}`;
    return fallback.length >= 2 ? fallback : `u_${Date.now()}`;
  }

  private normalizeStatus(status: string | null | undefined): 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED' {
    if (status === 'SUSPENDED') {
      return 'SUSPENDED';
    }
    if (status === 'DEACTIVATED' || status === 'DELETED' || status === 'INACTIVE') {
      return 'DEACTIVATED';
    }
    return 'ACTIVE';
  }

  private mapStatusFilter(status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED' | undefined): string {
    if (status === 'SUSPENDED') {
      return 'SUSPENDED';
    }
    if (status === 'INACTIVE' || status === 'DELETED') {
      return 'DEACTIVATED';
    }
    return 'ACTIVE';
  }
}
