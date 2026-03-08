import { EditorSession } from '../../../../domain-server/entities/editor-session';
import { SessionLayout } from '../../../../domain-server/value-objects/SessionLayout';

export class EditorSessionSqliteMapper {
  static toDomain(row: any): EditorSession {
    const layout = row.layout
      ? JSON.parse(row.layout)
      : {
          split_type: 'horizontal',
          group_count: 1,
          active_group_index: row.active_group_index ?? 0,
        };

    return EditorSession.load({
      id: row.id,
      workspaceId: row.workspace_id,
      identityId: row.identity_id ?? row.identityId ?? row.identity_id ?? row.identityId,
      name: row.name,
      description: row.description ?? null,
      groups: [],
      isActive: row.is_active === 1,
      activeGroupIndex: row.active_group_index ?? 0,
      layout: SessionLayout.fromDTO(layout),
      lastAccessedAt: row.last_accessed_at ?? null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    } as any);
  }
}
