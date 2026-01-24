/**
 * SQLite Account Repository Implementation
 * 璐︽埛鐨?SQLite 浠撳偍瀹炵幇
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
        uuid, username, email, phoneNumber, displayName, avatar,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        username = excluded.username,
        email = excluded.email,
        phoneNumber = excluded.phoneNumber,
        displayName = excluded.displayName,
        avatar = excluded.avatar,
        status = excluded.status,
        updatedAt = excluded.updatedAt
    `);;

    stmt.run(
      dto.uuid,
      dto.username,
      dto.email,
      dto.phoneNumber || null,
      dto.displayName || null,
      dto.avatar || null,
      dto.status,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findById(uuid: string): Promise<Account | null> {
    const stmt = this.db.prepare(`SELECT * FROM accounts WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return Account.fromPersistenceDTO(this.rowToPersistenceDTO(row));
  }

  async findByUsername(username: string): Promise<Account | null> {
    const stmt = this.db.prepare(`SELECT * FROM accounts WHERE username = ? LIMIT 1`);
    const row = stmt.get(username) as any;

    if (!row) return null;

    return Account.fromPersistenceDTO(this.rowToPersistenceDTO(row));
  }

  async findByEmail(email: string): Promise<Account | null> {
    const stmt = this.db.prepare(`SELECT * FROM accounts WHERE email = ? LIMIT 1`);
    const row = stmt.get(email) as any;

    if (!row) return null;

    return Account.fromPersistenceDTO(this.rowToPersistenceDTO(row));
  }

  async findByPhone(phoneNumber: string): Promise<Account | null> {
    const stmt = this.db.prepare(`SELECT * FROM accounts WHERE phoneNumber = ? LIMIT 1`);
    const row = stmt.get(phoneNumber) as any;

    if (!row) return null;

    return Account.fromPersistenceDTO(this.rowToPersistenceDTO(row));
  }

  async existsByUsername(username: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM accounts WHERE username = ? LIMIT 1`);
    return stmt.get(username) !== undefined;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM accounts WHERE email = ? LIMIT 1`);
    return stmt.get(email) !== undefined;
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM accounts WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async findAll(
    options?: {
      page?: number;
      pageSize?: number;
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
    },
  ): Promise<{ accounts: Account[]; total: number }> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 10;
    const offset = (page - 1) * pageSize;

    let countSql = 'SELECT COUNT(*) as count FROM accounts';
    let selectSql = 'SELECT * FROM accounts';

    if (options?.status) {
      const whereClause = ` WHERE status = '${options.status}'`;
      countSql += whereClause;
      selectSql += whereClause;
    }

    selectSql += ` LIMIT ${pageSize} OFFSET ${offset}`;

    const countStmt = this.db.prepare(countSql);
    const total = (countStmt.get() as any).count;

    const selectStmt = this.db.prepare(selectSql);
    const rows = selectStmt.all() as any[];

    const accounts = rows.map(row => Account.fromPersistenceDTO(this.rowToPersistenceDTO(row)));

    return { accounts, total };
  }

  private rowToPersistenceDTO(row: any) {
    return {
      uuid: row.uuid,
      username: row.username,
      email: row.email,
      emailVerified: row.emailVerified || false,
      phoneNumber: row.phoneNumber || null,
      phoneVerified: row.phoneVerified || false,
      displayName: row.displayName,
      avatar: row.avatar || null,
      bio: row.bio || null,
      location: row.location || null,
      timezone: row.timezone || 'UTC',
      language: row.language || 'en',
      dateOfBirth: row.dateOfBirth || null,
      gender: row.gender || null,
      preferences: row.preferences || '{}',
      subscriptionId: row.subscriptionId || null,
      subscriptionPlan: row.subscriptionPlan || null,
      subscriptionStatus: row.subscriptionStatus || null,
      subscriptionStartDate: row.subscriptionStartDate || null,
      subscriptionEndDate: row.subscriptionEndDate || null,
      subscriptionRenewalDate: row.subscriptionRenewalDate || null,
      subscriptionAutoRenew: row.subscriptionAutoRenew || null,
      storageUsed: row.storageUsed || 0,
      storageQuota: row.storageQuota || 0,
      storageQuotaType: row.storageQuotaType || 'FREE',
      twoFactorEnabled: row.twoFactorEnabled || false,
      lastPasswordChange: row.lastPasswordChange || null,
      loginAttempts: row.loginAttempts || 0,
      lockedUntil: row.lockedUntil || null,
      history: row.history || '[]',
      statsTotalGoals: row.statsTotalGoals || 0,
      statsTotalTasks: row.statsTotalTasks || 0,
      statsTotalSchedules: row.statsTotalSchedules || 0,
      statsTotalReminders: row.statsTotalReminders || 0,
      statsLastLoginAt: row.statsLastLoginAt || null,
      statsLoginCount: row.statsLoginCount || 0,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lastActiveAt: row.lastActiveAt || null,
      deletedAt: row.deletedAt || null,
    };
  }
}

