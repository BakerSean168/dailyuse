import { EditorGroup } from '../../../../domain-server/entities/editor-group';

export class EditorGroupSqliteMapper {
  static toDomain(row: any): EditorGroup {
    return EditorGroup.load({
      id: row.id,
      sessionId: row.session_id,
      workspaceId: row.workspace_id ?? row.workspaceId ?? row.workspace_id,
      identityId: row.identity_id ?? row.identityId ?? row.identity_id ?? row.identityId,
      groupIndex: row.group_index,
      activeTabIndex: row.active_tab_index ?? -1,
      name: row.name ?? null,
      tabs: [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    } as any);
  }
}
