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
        completedAt = excluded.completedAt,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,
      dto.goalUuid || null,
      dto.status,
      dto.startedAt,
      dto.completedAt || null,
      dto.durationMinutes || null,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async findById(uuid: string): Promise<FocusSession | null> {
    const stmt = this.db.prepare(`SELECT * FROM focus_sessions WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return this.rowToFocusSession(row);
  }

  async findActiveSession(accountUuid: string): Promise<FocusSession | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM focus_sessions WHERE accountUuid = ? AND status IN ('IN_PROGRESS', 'PAUSED') ORDER BY startedAt DESC LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return this.rowToFocusSession(row);
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

    return rows.map((row) => this.rowToFocusSession(row));
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

    return rows.map((row) => this.rowToFocusSession(row));
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM focus_sessions WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async exists(uuid: string): Promise<boolean> {
    const stmt = this.db.prepare(`SELECT 1 FROM focus_sessions WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;
    return !!row;
  }

  async count(
    accountUuid: string,
    options?: {
      status?: FocusSessionStatus[];
      startDate?: number;
      endDate?: number;
    },
  ): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM focus_sessions WHERE accountUuid = ?`;
    const params: any[] = [accountUuid];

    if (options?.status && options.status.length > 0) {
      const placeholders = options.status.map(() => '?').join(',');
      query += ` AND status IN (${placeholders})`;
      params.push(...options.status);
    }

    if (options?.startDate) {
      query += ` AND startedAt >= ?`;
      params.push(options.startDate);
    }

    if (options?.endDate) {
      query += ` AND startedAt <= ?`;
      params.push(options.endDate);
    }

    const stmt = this.db.prepare(query);
    const result = stmt.get(...params) as any;
    return result.count;
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

  // Private helper method to convert database row to FocusSession
  private rowToFocusSession(row: any): FocusSession {
    return FocusSession.fromPersistenceDTO({
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      goalUuid: row.goal_uuid,
      status: row.status as FocusSessionStatus,
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      durationMinutes: row.duration_minutes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      actualDurationMinutes: row.actual_duration_minutes || null,
      description: row.description || null,
      pausedAt: row.paused_at ? new Date(row.paused_at) : null,
      resumedAt: row.resumed_at ? new Date(row.resumed_at) : null,
      cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : null,
      pauseCount: row.pause_count || 0,
      pausedDurationMinutes: row.paused_duration_minutes || 0,


    });
  }
}


