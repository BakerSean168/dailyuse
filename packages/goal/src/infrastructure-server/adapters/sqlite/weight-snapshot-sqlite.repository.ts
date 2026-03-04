/**
 * SQLite Weight Snapshot Repository Implementation
 * 权重快照�?SQLite 仓储实现
 */

import type Database from 'better-sqlite3';
import { KeyResultWeightSnapshot } from '@/domain-server';
import type { IWeightSnapshotRepository, SnapshotQueryResult } from '@/domain-server';
import type { KeyResultWeightSnapshotPersistenceDTO } from '@dailyuse/contracts/goal';

export class SqliteWeightSnapshotRepository implements IWeightSnapshotRepository {
  constructor(private db: Database.Database) {}

  async save(snapshot: KeyResultWeightSnapshot): Promise<void> {
    const dto = snapshot.toPersistenceDTO();

    this.db
      .prepare(
        `INSERT INTO weight_snapshots (
        id, goal_id, identity_id, key_result_id, old_weight, new_weight, weight_delta,
        snapshot_time, trigger, reason, operator_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        new_weight = excluded.new_weight,
        weight_delta = excluded.weight_delta`,
      )
      .run(
        dto.id as string,
        dto.goalId as string,
        dto.identityId as string,
        dto.keyResultId as string,
        dto.oldWeight,
        dto.newWeight,
        dto.weightDelta,
        dto.snapshotTime instanceof Date ? dto.snapshotTime.getTime() : dto.snapshotTime,
        dto.trigger,
        dto.reason,
        dto.operatorId as string,
        dto.createdAt instanceof Date ? dto.createdAt.getTime() : dto.createdAt,
      );
  }

  async saveMany(snapshots: KeyResultWeightSnapshot[]): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO weight_snapshots (
        id, goal_id, identity_id, key_result_id, old_weight, new_weight, weight_delta,
        snapshot_time, trigger, reason, operator_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        new_weight = excluded.new_weight,
        weight_delta = excluded.weight_delta
    `);

    const transaction = this.db.transaction((items: KeyResultWeightSnapshot[]) => {
      for (const snapshot of items) {
        const dto = snapshot.toPersistenceDTO();
        insertStmt.run(
          dto.id as string,
          dto.goalId as string,
          dto.identityId as string,
          dto.keyResultId as string,
          dto.oldWeight,
          dto.newWeight,
          dto.weightDelta,
          dto.snapshotTime instanceof Date ? dto.snapshotTime.getTime() : dto.snapshotTime,
          dto.trigger,
          dto.reason,
          dto.operatorId as string,
          dto.createdAt instanceof Date ? dto.createdAt.getTime() : dto.createdAt,
        );
      }
    });

    transaction(snapshots);
  }

  async findByGoal(
    goalId: string,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<SnapshotQueryResult> {
    const offset = (page - 1) * pageSize;

    const countResult = this.db
      .prepare(`SELECT COUNT(*) as total FROM weight_snapshots WHERE goal_id = ?`)
      .get(goalId) as any;

    const rows = this.db
      .prepare(
        `SELECT * FROM weight_snapshots WHERE goal_id = ? ORDER BY snapshot_time DESC LIMIT ? OFFSET ?`,
      )
      .all(goalId, pageSize, offset) as any[];

    return {
      snapshots: rows.map((row) => this.rowToSnapshot(row)),
      total: countResult.total,
    };
  }

  async findByKeyResult(
    keyResultId: string,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<SnapshotQueryResult> {
    const offset = (page - 1) * pageSize;

    const countResult = this.db
      .prepare(`SELECT COUNT(*) as total FROM weight_snapshots WHERE key_result_id = ?`)
      .get(keyResultId) as any;

    const rows = this.db
      .prepare(
        `SELECT * FROM weight_snapshots WHERE key_result_id = ? ORDER BY snapshot_time DESC LIMIT ? OFFSET ?`,
      )
      .all(keyResultId, pageSize, offset) as any[];

    return {
      snapshots: rows.map((row) => this.rowToSnapshot(row)),
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

    const countResult = this.db
      .prepare(
        `SELECT COUNT(*) as total FROM weight_snapshots WHERE snapshot_time >= ? AND snapshot_time <= ?`,
      )
      .get(startTime, endTime) as any;

    const rows = this.db
      .prepare(
        `SELECT * FROM weight_snapshots WHERE snapshot_time >= ? AND snapshot_time <= ? ORDER BY snapshot_time ASC LIMIT ? OFFSET ?`,
      )
      .all(startTime, endTime, pageSize, offset) as any[];

    return {
      snapshots: rows.map((row) => this.rowToSnapshot(row)),
      total: countResult.total,
    };
  }

  async findById(id: string): Promise<KeyResultWeightSnapshot | null> {
    const row = this.db
      .prepare(`SELECT * FROM weight_snapshots WHERE id = ? LIMIT 1`)
      .get(id) as any;

    if (!row) return null;

    return this.rowToSnapshot(row);
  }

  async delete(id: string): Promise<void> {
    this.db.prepare(`DELETE FROM weight_snapshots WHERE id = ?`).run(id);
  }

  async deleteByGoal(goalId: string): Promise<void> {
    this.db.prepare(`DELETE FROM weight_snapshots WHERE goal_id = ?`).run(goalId);
  }

  async deleteByKeyResult(keyResultId: string): Promise<void> {
    this.db.prepare(`DELETE FROM weight_snapshots WHERE key_result_id = ?`).run(keyResultId);
  }

  private rowToSnapshot(row: any): KeyResultWeightSnapshot {
    const dto: KeyResultWeightSnapshotPersistenceDTO = {
      id: row.id,
      identityId: row.identity_id,
      goalId: row.goal_id,
      keyResultId: row.key_result_id,
      oldWeight: row.old_weight,
      newWeight: row.new_weight,
      weightDelta: row.weight_delta,
      snapshotTime: new Date(row.snapshot_time),
      trigger: row.trigger,
      reason: row.reason ?? null,
      operatorId: row.operator_id,
      createdAt: new Date(row.created_at),
    };

    return KeyResultWeightSnapshot.fromPersistenceDTO(dto);
  }
}
