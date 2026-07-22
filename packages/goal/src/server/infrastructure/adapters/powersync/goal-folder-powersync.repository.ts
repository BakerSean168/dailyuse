import type { IGoalFolderRepository } from '../../../domain';
import { GoalFolder } from '../../../domain';
import { AggregateRepositoryBase, createEventBusAdapter } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils/domain';
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

    const existing = await this.db.getOptional<{ id: string; identity_id: string }>(
      `SELECT id, identity_id FROM goal_folders WHERE id = ? LIMIT 1`,
      [dto.id],
    );
    if (existing && String(existing.identity_id) !== String(dto.identityId)) {
      throw new Error('Goal folder not found for the current identity.');
    }

    if (existing) {
      await this.db.execute(
        `UPDATE goal_folders
         SET name = ?,
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
         WHERE id = ? AND identity_id = ?`,
        [
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
          dto.identityId,
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

  async findByIdForIdentity(identityId: string, id: string): Promise<GoalFolder | null> {
    const row = await this.db.getOptional<Record<string, unknown>>(
      `SELECT * FROM goal_folders WHERE id = ? AND identity_id = ? LIMIT 1`,
      [id, identityId],
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

  async delete(identityId: string, id: string): Promise<void> {
    const existing = await this.findByIdForIdentity(identityId, id);
    if (!existing) {
      throw new Error('Goal folder not found for the current identity.');
    }
    await this.db.execute(`DELETE FROM goal_folders WHERE id = ? AND identity_id = ?`, [
      id,
      identityId,
    ]);
  }

  async exists(identityId: string, id: string): Promise<boolean> {
    return (await this.findByIdForIdentity(identityId, id)) !== null;
  }
}
