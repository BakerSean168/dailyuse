import type { IAccountRepository } from '../../../domain-server';
import { Account } from '../../../domain-server';
import type { AppEventRegistry } from '@dailyuse/contracts/shared';
import { eventBus } from '@dailyuse/utils';
import {
  AccountPowerSyncMapper,
  type PowerSyncAccountRow,
} from './mappers/account-powersync.mapper';

type Queryable = {
  getAll<T>(sql: string, parameters?: unknown[]): Promise<T[]>;
  get<T>(sql: string, parameters?: unknown[]): Promise<T>;
  getOptional<T>(sql: string, parameters?: unknown[]): Promise<T | null>;
  execute(sql: string, parameters?: unknown[]): Promise<unknown>;
};

type Transactional = Queryable & {
  writeTransaction<T>(callback: (tx: Queryable) => Promise<T>): Promise<T>;
};

export class PowerSyncAccountRepository implements IAccountRepository {
  constructor(private readonly db: Transactional) {}

  async save(account: Account, tx?: unknown): Promise<void> {
    const executor = this.asQueryable(tx) ?? this.db;
    const row = AccountPowerSyncMapper.toRow(account);

    const existing = await executor.getOptional<{ id: string }>(
      `SELECT id FROM accounts WHERE id = ? LIMIT 1`,
      [row.id],
    );

    if (existing) {
      await executor.execute(
        `UPDATE accounts
         SET status = ?,
             profile = ?,
             settings = ?,
             email_address = ?,
             email_is_verified = ?,
             email_verified_at = ?,
             email_is_primary = ?,
             phone_country_code = ?,
             phone_number = ?,
             phone_full_number = ?,
             phone_is_verified = ?,
             phone_verified_at = ?,
             version = ?,
             updated_at = ?,
             deleted_at = ?
         WHERE id = ?`,
        [
          row.status,
          row.profile,
          row.settings,
          row.email_address,
          row.email_is_verified,
          row.email_verified_at,
          row.email_is_primary,
          row.phone_country_code,
          row.phone_number,
          row.phone_full_number,
          row.phone_is_verified,
          row.phone_verified_at,
          row.version,
          row.updated_at,
          row.deleted_at,
          row.id,
        ],
      );
    } else {
      await executor.execute(
        `INSERT INTO accounts (
           id,
           status,
           profile,
           settings,
           email_address,
           email_is_verified,
           email_verified_at,
           email_is_primary,
           phone_country_code,
           phone_number,
           phone_full_number,
           phone_is_verified,
           phone_verified_at,
           version,
           created_at,
           updated_at,
           deleted_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.id,
          row.status,
          row.profile,
          row.settings,
          row.email_address,
          row.email_is_verified,
          row.email_verified_at,
          row.email_is_primary,
          row.phone_country_code,
          row.phone_number,
          row.phone_full_number,
          row.phone_is_verified,
          row.phone_verified_at,
          row.version,
          row.created_at,
          row.updated_at,
          row.deleted_at,
        ],
      );
    }

    const domainEvents = account.pullDomainEvents();
    for (const evt of domainEvents) {
      const eventType = evt.eventType as keyof AppEventRegistry;
      eventBus.send(eventType, evt.payload as AppEventRegistry[typeof eventType]);
    }
  }

  async findById(id: string, tx?: unknown): Promise<Account | null> {
    const executor = this.asQueryable(tx) ?? this.db;
    const row = await executor.getOptional<PowerSyncAccountRow>(
      `SELECT * FROM accounts WHERE id = ? LIMIT 1`,
      [id],
    );
    return row ? AccountPowerSyncMapper.toDomain(row) : null;
  }

  async findByNickname(nickname: string, tx?: unknown): Promise<Account | null> {
    const executor = this.asQueryable(tx) ?? this.db;
    const row = await executor.getOptional<PowerSyncAccountRow>(
      `SELECT * FROM accounts WHERE json_extract(profile, '$.nickname') = ? LIMIT 1`,
      [nickname],
    );
    return row ? AccountPowerSyncMapper.toDomain(row) : null;
  }

  async findByEmail(email: string, tx?: unknown): Promise<Account | null> {
    const executor = this.asQueryable(tx) ?? this.db;
    const row = await executor.getOptional<PowerSyncAccountRow>(
      `SELECT * FROM accounts WHERE email_address = ? LIMIT 1`,
      [email],
    );
    return row ? AccountPowerSyncMapper.toDomain(row) : null;
  }

  async findByPhone(phoneNumber: string, tx?: unknown): Promise<Account | null> {
    const executor = this.asQueryable(tx) ?? this.db;
    const row = await executor.getOptional<PowerSyncAccountRow>(
      `SELECT * FROM accounts WHERE phone_number = ? LIMIT 1`,
      [phoneNumber],
    );
    return row ? AccountPowerSyncMapper.toDomain(row) : null;
  }

  async existsByNickname(nickname: string, tx?: unknown): Promise<boolean> {
    const executor = this.asQueryable(tx) ?? this.db;
    const row = await executor.getOptional<{ exists: number }>(
      `SELECT 1 as exists FROM accounts WHERE json_extract(profile, '$.nickname') = ? LIMIT 1`,
      [nickname],
    );
    return !!row;
  }

  async existsByEmail(email: string, tx?: unknown): Promise<boolean> {
    const executor = this.asQueryable(tx) ?? this.db;
    const row = await executor.getOptional<{ exists: number }>(
      `SELECT 1 as exists FROM accounts WHERE email_address = ? LIMIT 1`,
      [email],
    );
    return !!row;
  }

  async delete(id: string, tx?: unknown): Promise<void> {
    const executor = this.asQueryable(tx) ?? this.db;
    await executor.execute(`DELETE FROM accounts WHERE id = ?`, [id]);
  }

  async findAll(
    options?: {
      page?: number;
      pageSize?: number;
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
    },
    tx?: unknown,
  ): Promise<{ accounts: Account[]; total: number }> {
    const executor = this.asQueryable(tx) ?? this.db;
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 10;
    const offset = (page - 1) * pageSize;
    const status = this.mapStatusFilter(options?.status);
    const whereClause = status ? ` WHERE status = ?` : '';
    const params = status ? [status] : [];

    const totalRow = await executor.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM accounts${whereClause}`,
      params,
    );

    const rows = await executor.getAll<PowerSyncAccountRow>(
      `SELECT * FROM accounts${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );

    return {
      accounts: rows.map((row) => AccountPowerSyncMapper.toDomain(row)),
      total: Number(totalRow.count ?? 0),
    };
  }

  private asQueryable(tx?: unknown): Queryable | null {
    if (!tx || typeof tx !== 'object') {
      return null;
    }

    const candidate = tx as Partial<Queryable>;
    if (
      typeof candidate.getAll === 'function' &&
      typeof candidate.get === 'function' &&
      typeof candidate.getOptional === 'function' &&
      typeof candidate.execute === 'function'
    ) {
      return candidate as Queryable;
    }

    return null;
  }

  private mapStatusFilter(
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED' | undefined,
  ): string | null {
    if (status === 'SUSPENDED') {
      return 'Suspended';
    }
    if (status === 'INACTIVE' || status === 'DELETED') {
      return 'Deactivated';
    }
    if (status === 'ACTIVE') {
      return 'Active';
    }
    return null;
  }
}
