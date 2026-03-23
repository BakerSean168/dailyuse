import type { IElectronDatabase, IElectronDatabaseTransaction } from '@dailyuse/contracts/electron';
import type { IEditorTabRepository } from '../../../domain-server/repositories/IEditorTabRepository';
import { EditorTab } from '../../../domain-server/entities/editor-tab';

type TabRow = {
  id: string;
  group_id: string;
  session_id: string;
  workspace_id: string;
  identity_id: string;
  resource_id: string | null;
  tab_index: number;
  tab_type: string;
  title: string;
  view_state: string;
  is_pinned: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

function parseViewState(viewState: string) {
  try {
    return JSON.parse(viewState) as {
      scrollTop: number;
      scrollLeft: number;
      cursorPosition: { line: number; column: number };
      selections: Array<{
        start: { line: number; column: number };
        end: { line: number; column: number };
      }> | null;
    };
  } catch {
    return {
      scrollTop: 0,
      scrollLeft: 0,
      cursorPosition: { line: 1, column: 1 },
      selections: null,
    };
  }
}

function toDomain(row: TabRow): EditorTab {
  return EditorTab.load({
    id: row.id as any,
    groupId: row.group_id as any,
    sessionId: row.session_id as any,
    workspaceId: row.workspace_id as any,
    identityId: row.identity_id as any,
    resourceId: row.resource_id,
    tabIndex: row.tab_index,
    tabType: row.tab_type as any,
    name: row.title,
    viewState: parseViewState(row.view_state),
    isPinned: row.is_pinned === 1,
    isActive: row.is_active === 1,
    isDirty: false,
    lastAccessedAt: null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

export class PowerSyncEditorTabRepository implements IEditorTabRepository {
  constructor(private readonly db: IElectronDatabase) {}

  async findById(id: string): Promise<EditorTab | null> {
    const row = await this.db.getOptional<TabRow>(
      'SELECT * FROM editor_workspace_session_group_tabs WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [id],
    );
    return row ? toDomain(row) : null;
  }

  async findByGroupId(groupId: string): Promise<EditorTab[]> {
    const rows = await this.db.getAll<TabRow>(
      'SELECT * FROM editor_workspace_session_group_tabs WHERE group_id = ? AND deleted_at IS NULL ORDER BY tab_index ASC',
      [groupId],
    );
    return rows.map(toDomain);
  }

  async findByResourceId(resourceId: string): Promise<EditorTab[]> {
    const rows = await this.db.getAll<TabRow>(
      'SELECT * FROM editor_workspace_session_group_tabs WHERE resource_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC',
      [resourceId],
    );
    return rows.map(toDomain);
  }

  async findByGroupIdAndTabIndex(groupId: string, tabIndex: number): Promise<EditorTab | null> {
    const row = await this.db.getOptional<TabRow>(
      'SELECT * FROM editor_workspace_session_group_tabs WHERE group_id = ? AND tab_index = ? AND deleted_at IS NULL LIMIT 1',
      [groupId, tabIndex],
    );
    return row ? toDomain(row) : null;
  }

  async findPinnedByGroupId(groupId: string): Promise<EditorTab[]> {
    const rows = await this.db.getAll<TabRow>(
      'SELECT * FROM editor_workspace_session_group_tabs WHERE group_id = ? AND is_pinned = 1 AND deleted_at IS NULL ORDER BY tab_index ASC',
      [groupId],
    );
    return rows.map(toDomain);
  }

  async findDirtyByGroupId(_groupId: string): Promise<EditorTab[]> {
    return [];
  }

  async findRecentlyAccessed(groupId: string, limit: number): Promise<EditorTab[]> {
    const rows = await this.db.getAll<TabRow>(
      'SELECT * FROM editor_workspace_session_group_tabs WHERE group_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT ?',
      [groupId, limit],
    );
    return rows.map(toDomain);
  }

  async save(tab: EditorTab): Promise<void> {
    await this.saveWithExecutor(this.db, tab);
  }

  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM editor_workspace_session_group_tabs WHERE id = ?', [id]);
  }

  async saveBatch(tabs: EditorTab[]): Promise<void> {
    await this.db.writeTransaction(async (tx) => {
      for (const tab of tabs) {
        await this.saveWithExecutor(tx, tab);
      }
    });
  }

  private async saveWithExecutor(
    executor: IElectronDatabaseTransaction,
    tab: EditorTab,
  ): Promise<void> {
    const dto = tab.toServerDTO();
    const existing = await executor.getOptional<{ id: string }>(
      'SELECT id FROM editor_workspace_session_group_tabs WHERE id = ? LIMIT 1',
      [dto.id],
    );

    if (existing) {
      await executor.execute(
        `UPDATE editor_workspace_session_group_tabs
          SET group_id = ?, session_id = ?, workspace_id = ?, identity_id = ?, resource_id = ?, tab_index = ?,
             tab_type = ?, title = ?, view_state = ?, is_pinned = ?, is_active = ?, updated_at = ?
         WHERE id = ?`,
        [
          dto.groupId,
          dto.sessionId,
          dto.workspaceId,
          dto.identityId,
          dto.resourceId,
          dto.tabIndex,
          dto.tabType,
          dto.name,
          JSON.stringify(dto.viewState),
          dto.isPinned ? 1 : 0,
          dto.isActive ? 1 : 0,
          new Date(dto.updatedAt).toISOString(),
          dto.id,
        ],
      );
      return;
    }

    await executor.execute(
      `INSERT INTO editor_workspace_session_group_tabs (
          id, group_id, session_id, workspace_id, identity_id, resource_id, tab_index, tab_type,
         title, view_state, is_pinned, is_active, version, created_at, updated_at, deleted_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [
        dto.id,
        dto.groupId,
        dto.sessionId,
        dto.workspaceId,
        dto.identityId,
        dto.resourceId,
        dto.tabIndex,
        dto.tabType,
        dto.name,
        JSON.stringify(dto.viewState),
        dto.isPinned ? 1 : 0,
        dto.isActive ? 1 : 0,
        new Date(dto.createdAt).toISOString(),
        new Date(dto.updatedAt).toISOString(),
      ],
    );
  }

  async deleteByGroupId(groupId: string): Promise<void> {
    await this.db.execute('DELETE FROM editor_workspace_session_group_tabs WHERE group_id = ?', [
      groupId,
    ]);
  }

  async deleteByResourceId(resourceId: string): Promise<void> {
    await this.db.execute('DELETE FROM editor_workspace_session_group_tabs WHERE resource_id = ?', [
      resourceId,
    ]);
  }

  async countByGroupId(groupId: string): Promise<number> {
    const row = await this.db.getOptional<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM editor_workspace_session_group_tabs WHERE group_id = ? AND deleted_at IS NULL',
      [groupId],
    );
    return Number(row?.cnt ?? 0);
  }

  async countDirtyByGroupId(_groupId: string): Promise<number> {
    return 0;
  }

  async getMaxTabIndex(groupId: string): Promise<number> {
    const row = await this.db.getOptional<{ tab_index: number }>(
      'SELECT tab_index FROM editor_workspace_session_group_tabs WHERE group_id = ? AND deleted_at IS NULL ORDER BY tab_index DESC LIMIT 1',
      [groupId],
    );
    return Number(row?.tab_index ?? -1);
  }
}
