/**
 * SQLite GoalRecord Repository Implementation
 * 目标进度记录的 SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { GoalRecord } from '@/domain-server';
import type { IGoalRecordRepository, GoalRecordQueryOptions } from '@/domain-server';
import type { GoalRecordPersistenceDTO } from '@dailyuse/contracts/goal';

// Helper: Date → INTEGER (millis)
function dateToInt(d: Date | null | undefined): number | null {
  if (!d) return null;
  return d instanceof Date ? d.getTime() : (d as number);
}

export class SqliteGoalRecordRepository implements IGoalRecordRepository {
  constructor(private db: Database.Database) {}

  async save(record: GoalRecord): Promise<void> {
    const dto = record.toPersistenceDTO();

    this.db
      .prepare(
        `INSERT INTO goal_records (
        id, key_result_id, value, note, recorded_at,
        version, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        value = excluded.value,
        note = excluded.note,
        recorded_at = excluded.recorded_at,
        version = excluded.version,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at`,
      )
      .run(
        dto.id as string,
        dto.keyResultId as string,
        dto.value,
        dto.note,
        dateToInt(dto.recordedAt),
        dto.version,
        dateToInt(dto.createdAt),
        dateToInt(dto.updatedAt),
        dateToInt(dto.deletedAt),
      );
  }

  async findByKeyResultId(
    keyResultId: string,
    options?: GoalRecordQueryOptions,
  ): Promise<GoalRecord[]> {
    let query = `SELECT * FROM goal_records WHERE key_result_id = ? AND deleted_at IS NULL`;
    const params: any[] = [keyResultId];

    if (options?.startTime) {
      query += ` AND recorded_at >= ?`;
      params.push(options.startTime.getTime());
    }

    if (options?.endTime) {
      query += ` AND recorded_at <= ?`;
      params.push(options.endTime.getTime());
    }

    const orderDir = (options?.orderBy ?? 'asc').toUpperCase();
    query += ` ORDER BY recorded_at ${orderDir}`;

    if (options?.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);
    }

    const rows = this.db.prepare(query).all(...params) as any[];
    return rows.map((row) => this.rowToGoalRecord(row));
  }

  async findByGoalId(
    goalId: string,
    options?: GoalRecordQueryOptions,
  ): Promise<GoalRecord[]> {
    // Join through key_results to find all records for a goal
    let query = `
      SELECT gr.* FROM goal_records gr
      INNER JOIN key_results kr ON gr.key_result_id = kr.id
      WHERE kr.goal_id = ? AND gr.deleted_at IS NULL
    `;
    const params: any[] = [goalId];

    if (options?.startTime) {
      query += ` AND gr.recorded_at >= ?`;
      params.push(options.startTime.getTime());
    }

    if (options?.endTime) {
      query += ` AND gr.recorded_at <= ?`;
      params.push(options.endTime.getTime());
    }

    const orderDir = (options?.orderBy ?? 'asc').toUpperCase();
    query += ` ORDER BY gr.recorded_at ${orderDir}`;

    if (options?.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);
    }

    const rows = this.db.prepare(query).all(...params) as any[];
    return rows.map((row) => this.rowToGoalRecord(row));
  }

  async findByKeyResultIds(
    keyResultIds: string[],
    options?: GoalRecordQueryOptions,
  ): Promise<Map<string, GoalRecord[]>> {
    const result = new Map<string, GoalRecord[]>();
    if (keyResultIds.length === 0) return result;

    const placeholders = keyResultIds.map(() => '?').join(',');
    let query = `SELECT * FROM goal_records WHERE key_result_id IN (${placeholders}) AND deleted_at IS NULL`;
    const params: any[] = [...keyResultIds];

    if (options?.startTime) {
      query += ` AND recorded_at >= ?`;
      params.push(options.startTime.getTime());
    }

    if (options?.endTime) {
      query += ` AND recorded_at <= ?`;
      params.push(options.endTime.getTime());
    }

    const orderDir = (options?.orderBy ?? 'asc').toUpperCase();
    query += ` ORDER BY recorded_at ${orderDir}`;

    if (options?.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);
    }

    const rows = this.db.prepare(query).all(...params) as any[];

    // Initialize map with empty arrays
    for (const krId of keyResultIds) {
      result.set(krId, []);
    }

    // Group by key_result_id
    for (const row of rows) {
      const record = this.rowToGoalRecord(row);
      const krId = row.key_result_id;
      const list = result.get(krId) ?? [];
      list.push(record);
      result.set(krId, list);
    }

    return result;
  }

  async countByKeyResultId(keyResultId: string): Promise<number> {
    const result = this.db
      .prepare(
        `SELECT COUNT(*) as count FROM goal_records WHERE key_result_id = ? AND deleted_at IS NULL`,
      )
      .get(keyResultId) as any;
    return result.count;
  }

  async delete(recordId: string): Promise<void> {
    this.db
      .prepare(`DELETE FROM goal_records WHERE id = ?`)
      .run(recordId);
  }

  async deleteMany(recordIds: string[]): Promise<void> {
    if (recordIds.length === 0) return;
    const placeholders = recordIds.map(() => '?').join(',');
    this.db
      .prepare(`DELETE FROM goal_records WHERE id IN (${placeholders})`)
      .run(...recordIds);
  }

  private rowToGoalRecord(row: any): GoalRecord {
    const dto: GoalRecordPersistenceDTO = {
      id: row.id,
      keyResultId: row.key_result_id,
      value: row.value,
      note: row.note ?? null,
      recordedAt: new Date(row.recorded_at),
      version: row.version ?? 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    };

    return GoalRecord.fromPersistenceDTO(dto);
  }
}
