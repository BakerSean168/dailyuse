/**
 * SQLite FocusMode Repository Implementation
 * 专注模式�?SQLite 仓储实现
 *
 * FocusMode 是一个值对象，有关联表 focus_mode_goals 存储关联�?Goal IDs
 */

import type Database from 'better-sqlite3';
import { FocusMode } from '@/domain-server';
import type { IFocusModeRepository } from '@/domain-server';
import type { FocusModePersistenceDTO } from '@dailyuse/contracts/goal';
import type { GoalId } from '@dailyuse/contracts/primitives';

export class SqliteFocusModeRepository implements IFocusModeRepository {
  constructor(private db: Database.Database) {}

  async save(focusMode: FocusMode): Promise<void> {
    const dto = focusMode.toPersistenceDTO();

    this.db.transaction(() => {
      // 1. Upsert focus_modes
      this.db
        .prepare(
          `INSERT INTO focus_modes (
          id, identity_id, name, start_time, end_time,
          hidden_goals_mode, is_active, actual_end_time,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          is_active = excluded.is_active,
          actual_end_time = excluded.actual_end_time,
          hidden_goals_mode = excluded.hidden_goals_mode,
          updated_at = excluded.updated_at`,
        )
        .run(
          dto.id as string,
          dto.identityId as string,
          dto.name,
          dto.startTime instanceof Date ? dto.startTime.getTime() : dto.startTime,
          dto.endTime instanceof Date ? dto.endTime.getTime() : dto.endTime,
          dto.hiddenGoalsMode,
          dto.isActive ? 1 : 0,
          dto.actualEndTime
            ? dto.actualEndTime instanceof Date
              ? dto.actualEndTime.getTime()
              : dto.actualEndTime
            : null,
          dto.createdAt instanceof Date ? dto.createdAt.getTime() : dto.createdAt,
          dto.updatedAt instanceof Date ? dto.updatedAt.getTime() : dto.updatedAt,
        );

      // 2. Sync focus_mode_goals
      this.db
        .prepare(`DELETE FROM focus_mode_goals WHERE focus_mode_id = ?`)
        .run(dto.id as string);

      const goalIds = focusMode.focusedGoalIds;
      if (goalIds.length > 0) {
        const insertGoal = this.db.prepare(
          `INSERT INTO focus_mode_goals (focus_mode_id, goal_id) VALUES (?, ?)`,
        );
        for (const goalId of goalIds) {
          insertGoal.run(dto.id as string, goalId as string);
        }
      }
    })();
  }

  async findById(id: string): Promise<FocusMode | null> {
    const row = this.db
      .prepare(`SELECT * FROM focus_modes WHERE id = ? LIMIT 1`)
      .get(id) as any;

    if (!row) return null;

    return this.rowToFocusMode(row);
  }

  async findActiveByIdentityId(identityId: string): Promise<FocusMode | null> {
    const row = this.db
      .prepare(
        `SELECT * FROM focus_modes
       WHERE identity_id = ? AND is_active = 1
       ORDER BY start_time DESC LIMIT 1`,
      )
      .get(identityId) as any;

    if (!row) return null;

    return this.rowToFocusMode(row);
  }

  async findByIdentityId(identityId: string): Promise<FocusMode[]> {
    const rows = this.db
      .prepare(
        `SELECT * FROM focus_modes WHERE identity_id = ? ORDER BY created_at DESC`,
      )
      .all(identityId) as any[];

    return rows.map((row) => this.rowToFocusMode(row));
  }

  async deactivateExpired(): Promise<number> {
    const now = Date.now();
    const result = this.db
      .prepare(
        `UPDATE focus_modes
       SET is_active = 0, actual_end_time = end_time, updated_at = ?
       WHERE is_active = 1 AND end_time < ?`,
      )
      .run(now, now);

    return result.changes ?? 0;
  }

  async delete(id: string): Promise<void> {
    this.db.transaction(() => {
      this.db
        .prepare(`DELETE FROM focus_mode_goals WHERE focus_mode_id = ?`)
        .run(id);
      this.db
        .prepare(`DELETE FROM focus_modes WHERE id = ?`)
        .run(id);
    })();
  }

  private rowToFocusMode(row: any): FocusMode {
    // Load associated goal IDs
    const goalRows = this.db
      .prepare(`SELECT goal_id FROM focus_mode_goals WHERE focus_mode_id = ?`)
      .all(row.id) as any[];

    const focusedGoalIds = goalRows.map((r) => r.goal_id as GoalId);

    const dto: FocusModePersistenceDTO = {
      id: row.id,
      identityId: row.identity_id,
      name: row.name ?? '',
      startTime: new Date(row.start_time),
      endTime: new Date(row.end_time),
      hiddenGoalsMode: row.hidden_goals_mode ?? 'hide',
      isActive: row.is_active === 1,
      actualEndTime: row.actual_end_time ? new Date(row.actual_end_time) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    // fromPersistenceDTO sets focusedGoalIds to [], so we create via fromDTO
    const mode = FocusMode.fromPersistenceDTO(dto);
    // Re-create with the loaded goal IDs
    return FocusMode.fromDTO({
      ...mode.toDTO(),
      focusedGoalIds,
    });
  }
}
