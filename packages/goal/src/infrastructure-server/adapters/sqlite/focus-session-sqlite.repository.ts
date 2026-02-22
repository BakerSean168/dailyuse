/**
 * SQLite FocusSession Repository Implementation
 * 专注会话的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { FocusSession } from '@/domain-server';
import type { IFocusSessionRepository } from '@/domain-server';
import type { FocusSessionStatus } from '@dailyuse/contracts/goal';
import { SqliteFocusSessionMapper } from '../../mappers/sqlite/sqlite-focus-session-mapper';
import { dateToInt } from '../../mappers/sqlite/sqlite-goal-mapper';

// Column name mapping (domain field → SQL snake_case)
const ORDER_BY_MAP: Record<string, string> = {
  createdAt: 'created_at',
  startedAt: 'started_at',
  completedAt: 'completed_at',
  updatedAt: 'updated_at',
};

export class SqliteFocusSessionRepository implements IFocusSessionRepository {
  constructor(private db: Database.Database) {}

  async save(session: FocusSession): Promise<void> {
    const dto = session.toServerDTO();

    this.db
      .prepare(
        `INSERT INTO focus_sessions (
        id, identity_id, goal_id, status, duration_minutes,
        actual_duration_minutes, description, started_at, paused_at,
        resumed_at, completed_at, cancelled_at, pause_count,
        paused_duration_minutes, version, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        actual_duration_minutes = excluded.actual_duration_minutes,
        description = excluded.description,
        started_at = excluded.started_at,
        paused_at = excluded.paused_at,
        resumed_at = excluded.resumed_at,
        completed_at = excluded.completed_at,
        cancelled_at = excluded.cancelled_at,
        pause_count = excluded.pause_count,
        paused_duration_minutes = excluded.paused_duration_minutes,
        version = excluded.version,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at`,
      )
      .run(
        dto.id as string,
        dto.identityId as string,
        dto.goalId ? (dto.goalId as string) : null,
        dto.status,
        dto.durationMinutes,
        dto.actualDurationMinutes,
        dto.description,
        dto.startedAt,
        dto.pausedAt,
        dto.resumedAt,
        dto.completedAt,
        dto.cancelledAt,
        dto.pauseCount,
        dto.pausedDurationMinutes,
        dto.version,
        dto.createdAt,
        dto.updatedAt,
        dto.deletedAt,
      );
  }

  async findById(id: string): Promise<FocusSession | null> {
    const row = this.db
      .prepare(`SELECT * FROM focus_sessions WHERE id = ? LIMIT 1`)
      .get(id) as any;

    if (!row) return null;

    return this.rowToFocusSession(row);
  }

  async findActiveSession(identityId: string): Promise<FocusSession | null> {
    const row = this.db
      .prepare(
        `SELECT * FROM focus_sessions
       WHERE identity_id = ? AND status IN ('IN_PROGRESS', 'PAUSED')
       ORDER BY started_at DESC LIMIT 1`,
      )
      .get(identityId) as any;

    if (!row) return null;

    return this.rowToFocusSession(row);
  }

  async findByIdentityId(
    identityId: string,
    options?: {
      goalId?: string | null;
      status?: FocusSessionStatus[];
      limit?: number;
      offset?: number;
      orderBy?: 'createdAt' | 'startedAt' | 'completedAt' | 'updatedAt';
      orderDirection?: 'asc' | 'desc';
    },
  ): Promise<FocusSession[]> {
    let query = `SELECT * FROM focus_sessions WHERE identity_id = ?`;
    const params: any[] = [identityId];

    if (options?.goalId) {
      query += ` AND goal_id = ?`;
      params.push(options.goalId);
    }

    if (options?.status && options.status.length > 0) {
      const placeholders = options.status.map(() => '?').join(',');
      query += ` AND status IN (${placeholders})`;
      params.push(...options.status);
    }

    const orderCol = ORDER_BY_MAP[options?.orderBy ?? 'createdAt'] ?? 'created_at';
    const orderDir = (options?.orderDirection ?? 'desc').toUpperCase();
    query += ` ORDER BY ${orderCol} ${orderDir}`;

    if (options?.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);
    }

    if (options?.offset) {
      query += ` OFFSET ?`;
      params.push(options.offset);
    }

    const rows = this.db.prepare(query).all(...params) as any[];

    return rows.map((row) => this.rowToFocusSession(row));
  }

  async findByGoalId(
    goalId: string,
    options?: {
      status?: FocusSessionStatus[];
      limit?: number;
      offset?: number;
    },
  ): Promise<FocusSession[]> {
    let query = `SELECT * FROM focus_sessions WHERE goal_id = ?`;
    const params: any[] = [goalId];

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

    const rows = this.db.prepare(query).all(...params) as any[];
    return rows.map((row) => this.rowToFocusSession(row));
  }

  async delete(id: string): Promise<void> {
    this.db
      .prepare(`DELETE FROM focus_sessions WHERE id = ?`)
      .run(id);
  }

  async exists(id: string): Promise<boolean> {
    const row = this.db
      .prepare(`SELECT 1 FROM focus_sessions WHERE id = ? LIMIT 1`)
      .get(id);
    return row !== undefined;
  }

  async count(
    identityId: string,
    options?: {
      status?: FocusSessionStatus[];
      startDate?: number;
      endDate?: number;
    },
  ): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM focus_sessions WHERE identity_id = ?`;
    const params: any[] = [identityId];

    if (options?.status && options.status.length > 0) {
      const placeholders = options.status.map(() => '?').join(',');
      query += ` AND status IN (${placeholders})`;
      params.push(...options.status);
    }

    if (options?.startDate) {
      query += ` AND started_at >= ?`;
      params.push(options.startDate);
    }

    if (options?.endDate) {
      query += ` AND started_at <= ?`;
      params.push(options.endDate);
    }

    const result = this.db.prepare(query).get(...params) as any;
    return result.count;
  }

  private rowToFocusSession(row: any): FocusSession {
    return SqliteFocusSessionMapper.toDomain(row);
  }
}
