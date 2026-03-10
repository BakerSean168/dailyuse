import type { IGoalFolderRepository } from '@/domain-server';
import { GoalFolder } from '@/domain-server';
import { AggregateRepositoryBase, createEventBusAdapter } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils';
import type { GoalPowerSyncDatabase } from './shared';
import { toDbDateTime } from './shared';
import { PowerSyncGoalFolderMapper } from './mappers/powersync-goal-folder.mapper';

const eventBusAdapter = createEventBusAdapter(eventBus);

export class GoalFolderPowerSyncRepository
  extends AggregateRepositoryBase<GoalFolder>
  implements IGoalFolderRepository
{
  constructor(private readonly db: GoalPowerSyncDatabase) {
    super(eventBusAdapter);
  }

  protected async persist(folder: GoalFolder): Promise<void> {
    const dto = PowerSyncGoalFolderMapper.toPersistence(folder);

    const existing = await this.db.getOptional<{ id: string }>(
      `SELECT id FROM goal_folders WHERE id = ? LIMIT 1`,
      [dto.id],
    );

    if (existing) {
      await this.db.execute(
        `UPDATE goal_folders
         SET identity_id = ?,
             name = ?,
             description = ?,
             icon = ?,
             color = ?,
             folder_type = ?,
             is_system_folder = ?,
             parent_folder_id = ?,
             sort_order = ?,
             goal_count = ?,
             completed_goal_count = ?,
             version = ?,
             updated_at = ?,
             deleted_at = ?
         WHERE id = ?`,
        [
          dto.identityId,
          dto.name,
          dto.description,
          dto.icon,
          dto.color,
          dto.folderType,
          folder.isSystemFolder ? 1 : 0,
          dto.parentFolderId,
          dto.sortOrder,
          dto.goalCount,
          dto.completedGoalCount,
          dto.version,
          toDbDateTime(dto.updatedAt),
          toDbDateTime(dto.deletedAt),
          dto.id,
        ],
      );
    } else {
      await this.db.execute(
        `INSERT INTO goal_folders (
           id, identity_id, name, description, icon, color,
           folder_type, is_system_folder, parent_folder_id, sort_order,
           goal_count, completed_goal_count, version, created_at, updated_at, deleted_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dto.id,
          dto.identityId,
          dto.name,
          dto.description,
          dto.icon,
          dto.color,
          dto.folderType,
          folder.isSystemFolder ? 1 : 0,
          dto.parentFolderId,
          dto.sortOrder,
          dto.goalCount,
          dto.completedGoalCount,
          dto.version,
          toDbDateTime(dto.createdAt),
          toDbDateTime(dto.updatedAt),
          toDbDateTime(dto.deletedAt),
        ],
      );
    }
  }

  async findById(id: string): Promise<GoalFolder | null> {
    const row = await this.db.getOptional<Record<string, unknown>>(
      `SELECT * FROM goal_folders WHERE id = ? LIMIT 1`,
      [id],
    );

    return row ? PowerSyncGoalFolderMapper.toDomain(row) : null;
  }

  async findByIdentityId(identityId: string): Promise<GoalFolder[]> {
    const rows = await this.db.getAll<Record<string, unknown>>(
      `SELECT *
       FROM goal_folders
       WHERE identity_id = ?
         AND deleted_at IS NULL
       ORDER BY sort_order ASC, created_at ASC`,
      [identityId],
    );

    return rows.map((row) => PowerSyncGoalFolderMapper.toDomain(row));
  }

  async delete(id: string): Promise<void> {
    await this.db.execute(`DELETE FROM goal_folders WHERE id = ?`, [id]);
  }

  async exists(id: string): Promise<boolean> {
    const row = await this.db.getOptional<{ value: number }>(
      `SELECT 1 as value FROM goal_folders WHERE id = ? LIMIT 1`,
      [id],
    );

    return row !== null;
  }
}
