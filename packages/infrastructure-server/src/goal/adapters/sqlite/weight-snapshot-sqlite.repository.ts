/**
 * SQLite Weight Snapshot Repository Implementation
 * 鏉冮噸蹇収鐨?SQLite Repository瀹炵幇
 */

import type Database from 'better-sqlite3';
import { KeyResultWeightSnapshot } from '@dailyuse/domain-server/goal';
import type { IWeightSnapshotRepository, SnapshotQueryResult } from '@dailyuse/domain-server/goal';

export class SqliteWeightSnapshotRepository implements IWeightSnapshotRepository {
  constructor(private db: Database.Database) {}

  async save(snapshot: KeyResultWeightSnapshot): Promise<void> {
    const dto = snapshot.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO weight_snapshots (
        uuid, goal_uuid, key_result_uuid, weight, snapshot_time, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        weight = excluded.weight,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      dto.uuid,
      dto.goalUuid,
      dto.keyResultUuid,
      dto.newWeight,
      dto.snapshotTime,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  async saveMany(snapshots: KeyResultWeightSnapshot[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO weight_snapshots (
        uuid, goal_uuid, key_result_uuid, weight, snapshot_time, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        weight = excluded.weight,
        updated_at = excluded.updated_at
    `);

    const transaction = this.db.transaction((items: KeyResultWeightSnapshot[]) => {
      for (const snapshot of items) {
        const dto = snapshot.toPersistenceDTO();
        insertStmt.run(
          dto.uuid,
          dto.goalUuid,
          dto.keyResultUuid,
          dto.weight,
          dto.snapshotTime,
          dto.createdAt,
          dto.updatedAt,
        );
      }
    });

    transaction(snapshots);
  }

  async findByGoal(goalUuid: string, page: number = 1, pageSize: number = 50): Promise<SnapshotQueryResult> {
    const offset = (page - 1) * pageSize;

    const countStmt = this.db.prepare(
      `SELECT COUNT(*) as total FROM weight_snapshots WHERE goal_uuid = ?`
    );
    const countResult = countStmt.get(goalUuid) as any;

    const stmt = this.db.prepare(
      `SELECT * FROM weight_snapshots WHERE goal_uuid = ? ORDER BY snapshot_time DESC LIMIT ? OFFSET ?`
    );
    const rows = stmt.all(goalUuid, pageSize, offset) as any[];

    const snapshots = rows.map((row) => this.rowToSnapshot(row));

    return {
      snapshots,
      total: countResult.total,
    };
  }

  async findByKeyResult(krUuid: string, page: number = 1, pageSize: number = 50): Promise<SnapshotQueryResult> {
    const offset = (page - 1) * pageSize;

    const countStmt = this.db.prepare(
      `SELECT COUNT(*) as total FROM weight_snapshots WHERE key_result_uuid = ?`
    );
    const countResult = countStmt.get(krUuid) as any;

    const stmt = this.db.prepare(
      `SELECT * FROM weight_snapshots WHERE key_result_uuid = ? ORDER BY snapshot_time DESC LIMIT ? OFFSET ?`
    );
    const rows = stmt.all(krUuid, pageSize, offset) as any[];

    const snapshots = rows.map((row) => this.rowToSnapshot(row));

    return {
      snapshots,
      total: countResult.total,
    };
  }

  async findByTimeRange(
    startTime: number,
    endTime: number,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<SnapshotQueryResult> {
    const offset = (page - 1) * pageSize;

    const countStmt = this.db.prepare(
      `SELECT COUNT(*) as total FROM weight_snapshots WHERE snapshotTime >= ? AND snapshotTime <= ?`
    );
    const countResult = countStmt.get(startTime, endTime) as any;

    const stmt = this.db.prepare(
      `SELECT * FROM weight_snapshots WHERE snapshotTime >= ? AND snapshotTime <= ? ORDER BY snapshotTime ASC LIMIT ? OFFSET ?`
    );
    const rows = stmt.all(startTime, endTime, pageSize, offset) as any[];

    const snapshots = rows.map((row) => this.rowToSnapshot(row));

    return {
      snapshots,
      total: countResult.total,
    };
  }

  async findById(uuid: string): Promise<KeyResultWeightSnapshot | null> {
    const stmt = this.db.prepare(`SELECT * FROM weight_snapshots WHERE uuid = ? LIMIT 1`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return this.rowToSnapshot(row);
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM weight_snapshots WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async deleteByGoal(goalUuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM weight_snapshots WHERE goal_uuid = ?`);
    stmt.run(goalUuid);
  }

  private rowToSnapshot(row: any): KeyResultWeightSnapshot {
    // 从蛇形的行对象属性转换为驼峰的 DTO 对象
    return KeyResultWeightSnapshot.fromPersistenceDTO({
      uuid: row.uuid,
      goal_uuid: row.goal_uuid,
      kr_uuid: row.key_result_uuid,
      weight: row.weight,
      snapshot_time: row.snapshot_time,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  async delete(uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM weight_snapshots WHERE uuid = ?`);
    stmt.run(uuid);
  }

  async deleteByKeyResult(krUuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM weight_snapshots WHERE key_result_uuid = ?`);
    stmt.run(krUuid);
  }
}


