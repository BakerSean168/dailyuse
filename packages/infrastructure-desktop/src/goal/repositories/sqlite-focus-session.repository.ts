/**
 * SQLite FocusSession Repository Implementation
 * 专注会话的 SQLite 仓储实现
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
        uuid, account_uuid, goal_uuid, status, started_at, completed_at,
        duration_minutes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        status = excluded.status,
        completed_at = excluded.completed_at,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.account_uuid,
      dto.goal_uuid || null,
      dto.status,
      dto.started_at,
      dto.completed_at || null,
      dto.duration_minutes || null,
      dto.created_at,
      dto.updated_at,
    );
  }

  async findById(uuid: string): Promise<FocusSession | null> {
    const stmt = this.db.prepare(`SELECT * FROM focus_sessions WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return FocusSession.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      goal_uuid: row.goal_uuid,
      status: row.status as FocusSessionStatus,
      started_at: new Date(row.started_at),
      completed_at: row.completed_at ? new Date(row.completed_at) : null,
      duration_minutes: row.duration_minutes,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async findActiveSession(accountUuid: string): Promise<FocusSession | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM focus_sessions WHERE account_uuid = ? AND status IN ('IN_PROGRESS', 'PAUSED') ORDER BY started_at DESC LIMIT 1`
    );
    const row = stmt.get(accountUuid) as any;

    if (!row) return null;

    return FocusSession.fromPersistenceDTO({
      uuid: row.uuid,
      account_uuid: row.account_uuid,
      goal_uuid: row.goal_uuid,
      status: row.status as FocusSessionStatus,
      started_at: new Date(row.started_at),
      completed_at: row.completed_at ? new Date(row.completed_at) : null,
      duration_minutes: row.duration_minutes,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
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
    let query = `SELECT * FROM focus_sessions WHERE account_uuid = ?`;
    const params: any[] = [accountUuid];

    if (options?.goalUuid) {
      query += ` AND goal_uuid = ?`;
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
        account_uuid: row.account_uuid,
        goal_uuid: row.goal_uuid,
        status: row.status as FocusSessionStatus,
        started_at: new Date(row.started_at),
        completed_at: row.completed_at ? new Date(row.completed_at) : null,
        duration_minutes: row.duration_minutes,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
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
    let query = `SELECT * FROM focus_sessions WHERE goal_uuid = ?`;
    const params: any[] = [goalUuid];

    if (options?.status && options.status.length > 0) {
      const placeholders = options.status.map(() => '?').join(',');
      query += ` AND status IN (${placeholders})`;
      params.push(...options.status);
    }

    query += ` ORDER BY started_at DESC`;

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
        account_uuid: row.account_uuid,
        goal_uuid: row.goal_uuid,
        status: row.status as FocusSessionStatus,
        started_at: new Date(row.started_at),
        completed_at: row.completed_at ? new Date(row.completed_at) : null,
        duration_minutes: row.duration_minutes,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      })
    );
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM focus_sessions WHERE uuid = ?`);
    stmt.run(uuid);
  }

  private mapOrderBy(field: string): string {
    const mapping: Record<string, string> = {
      createdAt: 'created_at',
      startedAt: 'started_at',
      completedAt: 'completed_at',
      updatedAt: 'updated_at',
    };
    return mapping[field] || 'created_at';
  }
}
