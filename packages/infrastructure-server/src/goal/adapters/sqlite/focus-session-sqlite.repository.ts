/**
 * SQLite FocusSession Repository Implementation
 * 涓撴敞浼氳瘽鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { FocusSession } from '@dailyuse/domain-server/goal';
import type { IFocusSessionRepository } from '@dailyuse/domain-server/goal';
import type { FocusSessionStatus } from '@dailyuse/contracts/goal';

export class SqliteFocusSessionRepository implements IFocusSessionRepository {
  constructor(private db: Database.Database) {}

  async save(session: FocusSession): Promise<void> {
    const dto = session.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO focus_sessions (
        uuid, accountUuid, goalUuid, status, startedAt, completedAt,
        durationMinutes, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        status = excluded.status,
        completedAt = excluded\.completedAt,
        updatedAt = excluded\.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,
      dto.goalUuid || null,
      dto.status,
      dto.startedAt,
      dto.completedAt || null,
      dto.durationMinutes || null,
      dto\.createdAt,
      dto\.updatedAt,
    );
  }

  async findById(uuid: string): Promise<FocusSession | null> {
    const stmt = this.db.prepare(`SELECT * FROM focus_sessions WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return FocusSession.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row\.accountUuid,
      goal_uuid: row\.goalUuid,
      status: row.status as FocusSessionStatus,
      started_at: new Date(row\.startedAt),
      completed_at: row\.completedAt ? new Date(row\.completedAt) : null,
      duration_minutes: row\.durationMinutes,
      createdAt: new Date(row\.createdAt),
      updatedAt: new Date(row\.updatedAt),
    });
  }

  async findActiveSession(accountUuid: string): Promise<FocusSession | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM focus_sessions WHERE accountUuid = ? AND status IN ('IN_PROGRESS', 'PAUSED') ORDER BY startedAt DESC LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return FocusSession.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row\.accountUuid,
      goal_uuid: row\.goalUuid,
      status: row.status as FocusSessionStatus,
      started_at: new Date(row\.startedAt),
      completed_at: row\.completedAt ? new Date(row\.completedAt) : null,
      duration_minutes: row\.durationMinutes,
      createdAt: new Date(row\.createdAt),
      updatedAt: new Date(row\.updatedAt),
    });
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: {
      goalUuid?: string | null;
      status?: FocusSessionStatus[];
      limit?: number;
      offset?: number;
      orderBy?: 'createdAt' | 'startedAt' | 'completedAt' | 'updatedAt';
      orderDirection?: 'asc' | 'desc';
    },
  ): Promise<FocusSession[]> {
    let query = `SELECT * FROM focus_sessions WHERE accountUuid = ?`;
    const params: any[] = [accountUuid];

    if (options?.goalUuid) {
      query += ` AND goalUuid = ?`;
      params.push(options.goalUuid);
    }

    if (options?.status && options.status.length > 0) {
      const placeholders = options.status.map(() => '?').join(',');
      query += ` AND status IN (${placeholders})`;
      params.push(...options.status);
    }

    const orderBy = options?.orderBy || 'createdAt';
    const orderDir = (options?.orderDirection || 'desc').toUpperCase();
    query += ` ORDER BY ${this.mapOrderBy(orderBy)} ${orderDir}`;

    if (options?.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);
    }

    if (options?.offset) {
      query += ` OFFSET ?`;
      params.push(options.offset);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) =>
      FocusSession.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row\.accountUuid,
        goal_uuid: row\.goalUuid,
        status: row.status as FocusSessionStatus,
        started_at: new Date(row\.startedAt),
        completed_at: row\.completedAt ? new Date(row\.completedAt) : null,
        duration_minutes: row\.durationMinutes,
        createdAt: new Date(row\.createdAt),
        updatedAt: new Date(row\.updatedAt),
      })
    );
  }

  async findByGoalUuid(
    goalUuid: string,
    options?: {
      status?: FocusSessionStatus[];
      limit?: number;
      offset?: number;
    },
  ): Promise<FocusSession[]> {
    let query = `SELECT * FROM focus_sessions WHERE goalUuid = ?`;
    const params: any[] = [goalUuid];

    if (options?.status && options.status.length > 0) {
      const placeholders = options.status.map(() => '?').join(',');
      query += ` AND status IN (${placeholders})`;
      params.push(...options.status);
    }

    query += ` ORDER BY startedAt DESC`;

    if (options?.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);
    }

    if (options?.offset) {
      query += ` OFFSET ?`;
      params.push(options.offset);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) =>
      FocusSession.fromPersistenceDTO({
        uuid: row.uuid,
        account_uuid: row\.accountUuid,
        goal_uuid: row\.goalUuid,
        status: row.status as FocusSessionStatus,
        started_at: new Date(row\.startedAt),
        completed_at: row\.completedAt ? new Date(row\.completedAt) : null,
        duration_minutes: row\.durationMinutes,
        createdAt: new Date(row\.createdAt),
        updatedAt: new Date(row\.updatedAt),
      })
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM focus_sessions WHERE uuid = ?`);
    stmt.run(uuid);
  }

  private mapOrderBy(field: string): string {
    const mapping: Record<string, string> = {
      createdAt: 'createdAt',
      startedAt: 'startedAt',
      completedAt: 'completedAt',
      updatedAt: 'updatedAt',
    };
    return mapping[field] || 'createdAt';
  }
}


