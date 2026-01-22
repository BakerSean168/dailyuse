/**
 * SQLite AIUsageQuota Repository Implementation
 * AI 使用配额的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import type { IAIUsageQuotaRepository, AIUsageQuotaServerDTO } from '@dailyuse/domain-server/ai';

export class SqliteAIUsageQuotaRepository implements IAIUsageQuotaRepository {
  constructor(private db: Database.Database) {}

  async save(quota: AIUsageQuotaServerDTO): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO ai_usage_quotas (
        uuid, account_uuid, monthly_limit, used_count, reset_date,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_uuid) DO UPDATE SET
        monthly_limit = excluded.monthly_limit,
        used_count = excluded.used_count,
        reset_date = excluded.reset_date,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      quota.uuid,
      quota.account_uuid,
      quota.monthly_limit,
      quota.used_count,
      quota.reset_date,
      new Date(quota.created_at).getTime(),
      new Date(quota.updated_at).getTime(),
    );
  }

  async findByUuid(uuid: string): Promise<AIUsageQuotaServerDTO | null> {
    const stmt = this.db.prepare(`SELECT * FROM ai_usage_quotas WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return this.rowToDTO(row);
  }

  async findByAccountUuid(accountUuid: string): Promise<AIUsageQuotaServerDTO | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_usage_quotas WHERE account_uuid = ? LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return this.rowToDTO(row);
  }

  async createDefaultQuota(accountUuid: string): Promise<AIUsageQuotaServerDTO> {
    const uuid = this.generateUuid();
    const now = new Date();

    const stmt = this.db.prepare(`
      INSERT INTO ai_usage_quotas (
        uuid, account_uuid, monthly_limit, used_count, reset_date,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(uuid, accountUuid, 1000, 0, now.getTime(), now.getTime(), now.getTime());

    return {
      uuid,
      account_uuid: accountUuid,
      monthly_limit: 1000,
      used_count: 0,
      reset_date: now.getTime(),
      created_at: now,
      updated_at: now,
    };
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM ai_usage_quotas WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async exists(accountUuid: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM ai_usage_quotas WHERE account_uuid = ? LIMIT 1`
    );
    return stmt.get(accountUuid) !== undefined;
  }

  private rowToDTO(row: any): AIUsageQuotaServerDTO {
    return {
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      monthly_limit: row.monthly_limit,
      used_count: row.used_count,
      reset_date: row.reset_date,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }

  private generateUuid(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
