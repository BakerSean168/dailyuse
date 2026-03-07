import { TabType } from '@dailyuse/contracts/editor';
import { EditorTab } from '../../../../domain-server/entities/editor-tab';

export class EditorTabSqliteMapper {
  static toDomain(row: any): EditorTab {
    const viewState = row.view_state
      ? JSON.parse(row.view_state)
      : { scrollTop: 0, scrollLeft: 0, cursorPosition: { line: 0, column: 0 }, selections: [] };

    return EditorTab.load({
      id: row.id,
      groupId: row.group_id,
      sessionId: row.session_id,
      workspaceId: row.workspace_id ?? row.workspaceId ?? row.workspace_id,
      identityId: row.identity_id ?? row.identityId ?? row.identity_id ?? row.identityId,
      documentId: row.document_id,
      tabIndex: row.tab_index,
      tabType: (row.tab_type ?? row.tabType ?? TabType.Document) as any,
      name: row.name ?? 'Untitled',
      viewState,
      isPinned: row.is_pinned === 1,
      isDirty: row.is_dirty === 1,
      lastAccessedAt: row.last_accessed_at ? new Date(row.last_accessed_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    } as any);
  }
}
