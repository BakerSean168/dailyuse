import type { IElectronDatabase, IElectronDatabaseTransaction } from '@dailyuse/contracts/electron';
import type { IEditorWorkspaceRepository } from '../../../domain/repositories/i-editor-workspace-repository';
import { EditorWorkspace } from '../../../domain/aggregates/editor-workspace';
import {
  PowerSyncEditorWorkspaceMapper,
  type PowerSyncEditorWorkspaceRow,
} from './mappers/powersync-editor-workspace.mapper';
import { createEventBusAdapter, publishAggregateEvents } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils/domain';

const eventBusAdapter = createEventBusAdapter(eventBus);

export class PowerSyncEditorWorkspaceRepository implements IEditorWorkspaceRepository {
  constructor(private readonly db: IElectronDatabase) {}

  async findById(id: string): Promise<EditorWorkspace | null> {
    const row = await this.db.getOptional<PowerSyncEditorWorkspaceRow>(
      `SELECT * FROM editor_workspaces WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [id],
    );
    return row ? PowerSyncEditorWorkspaceMapper.toDomain(row) : null;
  }

  async findByIdentityId(identityId: string): Promise<EditorWorkspace[]> {
    const rows = await this.db.getAll<PowerSyncEditorWorkspaceRow>(
      `SELECT * FROM editor_workspaces WHERE identity_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
      [identityId],
    );
    return rows.map((row) => PowerSyncEditorWorkspaceMapper.toDomain(row));
  }

  async findByIdentityIdAndName(identityId: string, name: string): Promise<EditorWorkspace | null> {
    const row = await this.db.getOptional<PowerSyncEditorWorkspaceRow>(
      `SELECT * FROM editor_workspaces WHERE identity_id = ? AND name = ? AND deleted_at IS NULL LIMIT 1`,
      [identityId, name],
    );
    return row ? PowerSyncEditorWorkspaceMapper.toDomain(row) : null;
  }

  async findActiveByIdentityId(identityId: string): Promise<EditorWorkspace | null> {
    const row = await this.db.getOptional<PowerSyncEditorWorkspaceRow>(
      `SELECT * FROM editor_workspaces WHERE identity_id = ? AND is_active = 1 AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 1`,
      [identityId],
    );
    return row ? PowerSyncEditorWorkspaceMapper.toDomain(row) : null;
  }

  async save(workspace: EditorWorkspace): Promise<void> {
    await this.saveWithExecutor(this.db, workspace);
  }

  async createOrGet(workspace: EditorWorkspace): Promise<EditorWorkspace> {
    return this.db.writeTransaction(async (tx) => {
      const data = PowerSyncEditorWorkspaceMapper.toPersistence(workspace);
      const existing = await tx.getOptional<PowerSyncEditorWorkspaceRow>(
        `SELECT * FROM editor_workspaces
         WHERE identity_id = ? AND project_path = ?
         LIMIT 1`,
        [data.identity_id, data.project_path],
      );

      if (existing) {
        if (existing.deleted_at !== null) {
          await tx.execute(
            `UPDATE editor_workspaces
             SET deleted_at = NULL, updated_at = ?
             WHERE id = ?`,
            [data.updated_at, existing.id],
          );
          existing.deleted_at = null;
          existing.updated_at = data.updated_at;
        }
        return PowerSyncEditorWorkspaceMapper.toDomain(existing);
      }

      await this.insertWithExecutor(tx, data);
      const persisted = await tx.get<PowerSyncEditorWorkspaceRow>(
        `SELECT * FROM editor_workspaces
         WHERE identity_id = ? AND project_path = ?
         LIMIT 1`,
        [data.identity_id, data.project_path],
      );
      return PowerSyncEditorWorkspaceMapper.toDomain(persisted);
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.execute(`DELETE FROM editor_workspaces WHERE id = ?`, [id]);
  }

  async deleteAggregate(workspace: EditorWorkspace): Promise<void> {
    await this.db.execute(`DELETE FROM editor_workspaces WHERE id = ?`, [workspace.id]);
    await publishAggregateEvents(workspace, eventBusAdapter);
  }

  async saveBatch(workspaces: EditorWorkspace[]): Promise<void> {
    await this.db.writeTransaction(async (tx) => {
      for (const workspace of workspaces) {
        await this.saveWithExecutor(tx, workspace);
      }
    });
  }

  private async saveWithExecutor(
    executor: IElectronDatabaseTransaction,
    workspace: EditorWorkspace,
  ): Promise<void> {
    const d = PowerSyncEditorWorkspaceMapper.toPersistence(workspace);
    const existing = await executor.getOptional<{ id: string }>(
      `SELECT id FROM editor_workspaces WHERE id = ? LIMIT 1`,
      [d.id],
    );

    if (existing) {
      await executor.execute(
        `UPDATE editor_workspaces
         SET identity_id = ?,
             name = ?,
             description = ?,
             project_path = ?,
             project_type = ?,
             layout = ?,
             setting = ?,
             is_active = ?,
             version = ?,
             updated_at = ?,
             accessed_at = ?,
             deleted_at = ?
         WHERE id = ?`,
        [
          d.identity_id,
          d.name,
          d.description,
          d.project_path,
          d.project_type,
          d.layout,
          d.setting,
          d.is_active,
          d.version,
          d.updated_at,
          d.accessed_at,
          d.deleted_at,
          d.id,
        ],
      );
    } else {
      await this.insertWithExecutor(executor, d);
    }
  }

  private async insertWithExecutor(
    executor: IElectronDatabaseTransaction,
    data: ReturnType<typeof PowerSyncEditorWorkspaceMapper.toPersistence>,
  ): Promise<void> {
    await executor.execute(
      `INSERT INTO editor_workspaces (
         id, identity_id, name, description, project_path, project_type,
         layout, setting, is_active, version, created_at, updated_at, accessed_at, deleted_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.identity_id,
        data.name,
        data.description,
        data.project_path,
        data.project_type,
        data.layout,
        data.setting,
        data.is_active,
        data.version,
        data.created_at,
        data.updated_at,
        data.accessed_at,
        data.deleted_at,
      ],
    );
  }

  async existsByName(identityId: string, name: string): Promise<boolean> {
    const row = await this.db.getOptional<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM editor_workspaces WHERE identity_id = ? AND name = ? AND deleted_at IS NULL`,
      [identityId, name],
    );
    return Number(row?.cnt ?? 0) > 0;
  }

  async countByIdentityId(identityId: string): Promise<number> {
    const row = await this.db.getOptional<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM editor_workspaces WHERE identity_id = ? AND deleted_at IS NULL`,
      [identityId],
    );
    return Number(row?.cnt ?? 0);
  }
}
