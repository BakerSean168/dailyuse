/**
 * SQLite AIUsageQuota Repository Implementation
 */

import type Database from 'better-sqlite3';
import type { IAIUsageQuotaRepository } from '../../../domain-server/repositories/IAIUsageQuotaRepository';
import { QuotaResetPeriod, type AIUsageQuotaServerDTO } from '@dailyuse/contracts/ai';

export class SqliteAIUsageQuotaRepository implements IAIUsageQuotaRepository {
  constructor(private db: Database.Database) {}

  async save(quota: AIUsageQuotaServerDTO): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO ai_usage_quotas (
        id, identity_id, quota_limit, current_usage, reset_period,
        last_reset_at, next_reset_at, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        quota_limit = excluded.quota_limit,
        current_usage = excluded.current_usage,
        reset_period = excluded.reset_period,
        last_reset_at = excluded.last_reset_at,
        next_reset_at = excluded.next_reset_at,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at
    `);

    stmt.run(
      String(quota.id),
      String(quota.identityId),
      quota.quotaLimit,
      quota.currentUsage,
      quota.resetPeriod,
      quota.lastResetAt,
      quota.nextResetAt,
      quota.createdAt,
      quota.updatedAt,
      null,
    );
  }

  async findById(id: string): Promise<AIUsageQuotaServerDTO | null> {
    const row = this.db
      .prepare(
        `
        SELECT * FROM ai_usage_quotas
        WHERE id = ? AND deleted_at IS NULL
        LIMIT 1
      `,
      )
      .get(id) as any;

    return row ? this.rowToDTO(row) : null;
  }

  async findByIdentityId(identityId: string): Promise<AIUsageQuotaServerDTO | null> {
    const row = this.db
      .prepare(
        `
        SELECT * FROM ai_usage_quotas
        WHERE identity_id = ? AND deleted_at IS NULL
        LIMIT 1
      `,
      )
      .get(identityId) as any;

    return row ? this.rowToDTO(row) : null;
  }

  async createDefaultQuota(identityId: string): Promise<AIUsageQuotaServerDTO> {
    const now = Date.now();
    const nextResetAt = new Date(now);
    nextResetAt.setDate(nextResetAt.getDate() + 1);
    nextResetAt.setHours(0, 0, 0, 0);

    const quota: AIUsageQuotaServerDTO = {
      id: crypto.randomUUID() as AIUsageQuotaServerDTO['id'],
      identityId: identityId as AIUsageQuotaServerDTO['identityId'],
      quotaLimit: 50,
      currentUsage: 0,
      resetPeriod: QuotaResetPeriod.Daily,
      lastResetAt: now,
      nextResetAt: nextResetAt.getTime(),
      createdAt: now,
      updatedAt: now,
    };

    await this.save(quota);
    return quota;
  }

  async delete(id: string): Promise<void> {
    this.db
      .prepare(`UPDATE ai_usage_quotas SET deleted_at = ?, updated_at = ? WHERE id = ?`)
      .run(Date.now(), Date.now(), id);
  }

  async exists(identityId: string): Promise<boolean> {
    const row = this.db
      .prepare(
        `
        SELECT 1 FROM ai_usage_quotas
        WHERE identity_id = ? AND deleted_at IS NULL
        LIMIT 1
      `,
      )
      .get(identityId);

    return row !== undefined;
  }

  private rowToDTO(row: any): AIUsageQuotaServerDTO {
    return {
      id: row.id,
      identityId: row.identity_id,
      quotaLimit: row.quota_limit,
      currentUsage: row.current_usage,
      resetPeriod: row.reset_period,
      lastResetAt: row.last_reset_at,
      nextResetAt: row.next_reset_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
