import type { IElectronDatabase, IElectronDatabaseTransaction } from '@dailyuse/contracts/electron';
import type { IEditorGroupRepository } from '../../../domain-server/repositories/IEditorGroupRepository';
import { EditorGroup } from '../../../domain-server/entities/editor-group';

type GroupRow = {
  id: string;
  session_id: string;
  workspace_id: string;
  identity_id: string;
  group_index: number;
  name: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

function toDomain(row: GroupRow): EditorGroup {
  return EditorGroup.load({
    id: row.id as any,
    sessionId: row.session_id as any,
    workspaceId: row.workspace_id as any,
    identityId: row.identity_id as any,
    groupIndex: row.group_index,
    activeTabIndex: 0,
    name: row.name,
    tabs: [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

export class PowerSyncEditorGroupRepository implements IEditorGroupRepository {
  constructor(private readonly db: IElectronDatabase) {}

  async findById(id: string): Promise<EditorGroup | null> {
    const row = await this.db.getOptional<GroupRow>(
      'SELECT * FROM editor_workspace_session_groups WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [id],
    );
    return row ? toDomain(row) : null;
  }

  async findBySessionId(sessionId: string): Promise<EditorGroup[]> {
    const rows = await this.db.getAll<GroupRow>(
      'SELECT * FROM editor_workspace_session_groups WHERE session_id = ? AND deleted_at IS NULL ORDER BY group_index ASC',
      [sessionId],
    );
    return rows.map(toDomain);
  }

  async findBySessionIdAndGroupIndex(
    sessionId: string,
    groupIndex: number,
  ): Promise<EditorGroup | null> {
    const row = await this.db.getOptional<GroupRow>(
      'SELECT * FROM editor_workspace_session_groups WHERE session_id = ? AND group_index = ? AND deleted_at IS NULL LIMIT 1',
      [sessionId, groupIndex],
    );
    return row ? toDomain(row) : null;
  }

  async save(group: EditorGroup): Promise<void> {
    await this.saveWithExecutor(this.db, group);
  }

  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM editor_workspace_session_groups WHERE id = ?', [id]);
  }

  async saveBatch(groups: EditorGroup[]): Promise<void> {
    await this.db.writeTransaction(async (tx) => {
      for (const group of groups) {
        await this.saveWithExecutor(tx, group);
      }
    });
  }

  private async saveWithExecutor(
    executor: IElectronDatabaseTransaction,
    group: EditorGroup,
  ): Promise<void> {
    const dto = group.toServerDTO();
    const existing = await executor.getOptional<{ id: string }>(
      'SELECT id FROM editor_workspace_session_groups WHERE id = ? LIMIT 1',
      [dto.id],
    );

    if (existing) {
      await executor.execute(
        `UPDATE editor_workspace_session_groups
         SET session_id = ?, workspace_id = ?, identity_id = ?, group_index = ?, name = ?, updated_at = ?
         WHERE id = ?`,
        [
          dto.sessionId,
          dto.workspaceId,
          dto.identityId,
          dto.groupIndex,
          dto.name,
          new Date(dto.updatedAt).toISOString(),
          dto.id,
        ],
      );
      return;
    }

    await executor.execute(
      `INSERT INTO editor_workspace_session_groups (
         id, session_id, workspace_id, identity_id, group_index, name, split_direction, version, created_at, updated_at, deleted_at
       ) VALUES (?, ?, ?, ?, ?, ?, 'Horizontal', 1, ?, ?, NULL)`,
      [
        dto.id,
        dto.sessionId,
        dto.workspaceId,
        dto.identityId,
        dto.groupIndex,
        dto.name,
        new Date(dto.createdAt).toISOString(),
        new Date(dto.updatedAt).toISOString(),
      ],
    );
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    await this.db.execute('DELETE FROM editor_workspace_session_groups WHERE session_id = ?', [
      sessionId,
    ]);
  }

  async countBySessionId(sessionId: string): Promise<number> {
    const row = await this.db.getOptional<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM editor_workspace_session_groups WHERE session_id = ? AND deleted_at IS NULL',
      [sessionId],
    );
    return Number(row?.cnt ?? 0);
  }

  async getMaxGroupIndex(sessionId: string): Promise<number> {
    const row = await this.db.getOptional<{ group_index: number }>(
      'SELECT group_index FROM editor_workspace_session_groups WHERE session_id = ? AND deleted_at IS NULL ORDER BY group_index DESC LIMIT 1',
      [sessionId],
    );
    return Number(row?.group_index ?? -1);
  }
}
