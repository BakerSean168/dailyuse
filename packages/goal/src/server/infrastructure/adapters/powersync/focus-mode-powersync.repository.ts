import type { IFocusModeRepository } from '../../../domain';
import { FocusMode } from '../../../domain';
import { createLogger } from '@dailyuse/utils/logger';
import type { GoalPowerSyncDatabase } from './shared';
import { toDbDateTime } from './shared';
import { PowerSyncFocusModeMapper } from './mappers/powersync-focus-mode.mapper';

export class FocusModePowerSyncRepository implements IFocusModeRepository {
  private readonly logger = createLogger('goal:focus-mode-powersync-repo');

  constructor(private readonly db: GoalPowerSyncDatabase) {}

  async save(focusMode: FocusMode): Promise<void> {
    const dto = focusMode.toDTO();
    this.logger.info('保存专注模式', {
      id: dto.id,
      identityId: dto.identityId,
      isActive: dto.isActive,
      focusedGoalIds: dto.focusedGoalIds,
      startTime: dto.startTime,
      endTime: dto.endTime,
    });

    await this.db.writeTransaction(async (tx) => {
      const existing = await tx.getOptional<{ id: string }>(
        `SELECT id FROM focus_modes WHERE id = ? LIMIT 1`,
        [dto.id],
      );

      if (existing) {
        await tx.execute(
          `UPDATE focus_modes
           SET identity_id = ?,
               focused_goal_ids = ?,
               hidden_goals_mode = ?,
               start_time = ?,
               end_time = ?,
               actual_end_time = ?,
               is_active = ?,
               version = 1,
               created_at = ?,
               updated_at = ?,
               deleted_at = NULL
           WHERE id = ?`,
          [
            dto.identityId,
            JSON.stringify(dto.focusedGoalIds ?? []),
            dto.hiddenGoalsMode,
            toDbDateTime(dto.startTime),
            toDbDateTime(dto.endTime),
            toDbDateTime(dto.actualEndTime),
            dto.isActive ? 1 : 0,
            toDbDateTime(dto.createdAt),
            toDbDateTime(dto.updatedAt),
            dto.id,
          ],
        );
      } else {
        await tx.execute(
          `INSERT INTO focus_modes (
             id, identity_id, focused_goal_ids, hidden_goals_mode,
             start_time, end_time, actual_end_time, is_active,
             version, created_at, updated_at, deleted_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
          [
            dto.id,
            dto.identityId,
            JSON.stringify(dto.focusedGoalIds ?? []),
            dto.hiddenGoalsMode,
            toDbDateTime(dto.startTime),
            toDbDateTime(dto.endTime),
            toDbDateTime(dto.actualEndTime),
            dto.isActive ? 1 : 0,
            toDbDateTime(dto.createdAt),
            toDbDateTime(dto.updatedAt),
          ],
        );
      }
    });
  }

  async findByIdForIdentity(identityId: string, id: string): Promise<FocusMode | null> {
    const row = await this.db.getOptional<Record<string, unknown>>(
      `SELECT * FROM focus_modes WHERE id = ? AND identity_id = ? LIMIT 1`,
      [id, identityId],
    );
    return row ? PowerSyncFocusModeMapper.toDomain(row) : null;
  }

  async findActiveByIdentityId(identityId: string): Promise<FocusMode | null> {
    this.logger.info('按身份查询启用中的专注模式开始', {
      identityId,
    });
    const row = await this.db.getOptional<Record<string, unknown>>(
      `SELECT * FROM focus_modes
       WHERE identity_id = ? AND is_active = 1
       ORDER BY created_at DESC LIMIT 1`,
      [identityId],
    );
    this.logger.info('按身份查询启用中的专注模式结果', {
      identityId,
      found: !!row,
      id: row?.id ?? null,
      isActive: row?.is_active ?? null,
    });
    return row ? PowerSyncFocusModeMapper.toDomain(row) : null;
  }

  async findByIdentityId(identityId: string): Promise<FocusMode[]> {
    const rows = await this.db.getAll<Record<string, unknown>>(
      `SELECT * FROM focus_modes WHERE identity_id = ? ORDER BY created_at DESC`,
      [identityId],
    );
    return rows.map((row) => PowerSyncFocusModeMapper.toDomain(row));
  }

  async deactivateExpired(): Promise<number> {
    const now = new Date();
    const result = await this.db.execute(
      `UPDATE focus_modes
       SET is_active = 0,
           actual_end_time = ?,
           updated_at = ?
       WHERE is_active = 1 AND end_time < ?`,
      [toDbDateTime(now), toDbDateTime(now), toDbDateTime(now)],
    );
    return result.rowsAffected;
  }

  async delete(identityId: string, id: string): Promise<void> {
    const existing = await this.findByIdForIdentity(identityId, id);
    if (!existing) {
      throw new Error('Focus mode not found for the current identity.');
    }
    await this.db.execute(`DELETE FROM focus_modes WHERE id = ? AND identity_id = ?`, [
      id,
      identityId,
    ]);
  }
}
