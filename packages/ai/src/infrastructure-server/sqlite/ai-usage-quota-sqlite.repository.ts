/**
 * SQLite AIUsageQuota Repository Implementation
 * AI 浣跨敤閰嶉�?SQLite Repository瀹炵�?
 */

import type Database from 'better-sqlite3';
import type { IAIUsageQuotaRepository, AIUsageQuotaServerDTO } from '../../domain-server/repositories/IAIUsageQuotaRepository';

export class SqliteAIUsageQuotaRepository implements IAIUsageQuotaRepository {
  constructor(private db: Database.Database) {}

  async save(quota: AIUsageQuotaServerDTO): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO ai_usage_quotas (
        id, identityId, monthly_limit, used_count, reset_date,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(identityId) DO UPDATE SET
        monthly_limit = excluded.monthly_limit,
        used_count = excluded.used_count,
        reset_date = excluded.reset_date,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      quota.id,
      quota.identityId,
      quota.monthly_limit,
      quota.used_count,
      quota.reset_date,
      new Date(quota.createdAt).getTime(),
      new Date(quota.updatedAt).getTime(),
    );
  }

  async findById(id: string): Promise<AIUsageQuotaServerDTO | null> {
    const stmt = this.db.prepare(`SELECT * FROM ai_usage_quotas WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToDTO(row);
  }

  async findByAccountId(identityId: string): Promise<AIUsageQuotaServerDTO | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM ai_usage_quotas WHERE identityId = ? LIMIT 1`
    );
    const row = stmt.get(identityId) as any;

    if (!row) return null;

    return this.rowToDTO(row);
  }

  async createDefaultQuota(identityId: string): Promise<AIUsageQuotaServerDTO> {
    const newId = this.generateUuid();
    const now = new Date();

    const stmt = this.db.prepare(`
      INSERT INTO ai_usage_quotas (
        id, identityId, monthly_limit, used_count, reset_date,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, identityId, 1000, 0, now.getTime(), now.getTime(), now.getTime());

    return {
      id,
      identity_id: identityId,
      monthly_limit: 1000,
      used_count: 0,
      reset_date: now.getTime(),
      createdAt: now,
      updatedAt: now,
    };
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM ai_usage_quotas WHERE id = ?`);
    stmt.run(id);
  }

  async exists(identityId: string): Promise<boolean> {
    const stmt = this.db.prepare(
      `SELECT 1 FROM ai_usage_quotas WHERE identityId = ? LIMIT 1`
    );
    return stmt.get(identityId) !== undefined;
  }

  private rowToDTO(row: any): AIUsageQuotaServerDTO {
    return {
      id: row.id,
      identity_id: row.identityId,
      monthly_limit: row.monthly_limit,
      used_count: row.used_count,
      reset_date: row.reset_date,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  private generateUuid(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

