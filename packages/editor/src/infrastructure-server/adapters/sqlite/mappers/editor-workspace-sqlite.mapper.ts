import { EditorWorkspace } from '../../../../domain-server/aggregates/editor-workspace';
import { EditorWorkspaceId } from '../../../../domain-shared';
import { WorkspaceLayout } from '../../../../domain-shared/value-objects/workspace-layout';
import { WorkspaceSettings } from '../../../../domain-shared/value-objects/workspace-settings';
import { ProjectType } from '@dailyuse/contracts/editor';

export class EditorWorkspaceSqliteMapper {
  static toDomain(row: any): EditorWorkspace {
    const layoutData = row.layout
      ? typeof row.layout === 'string'
        ? JSON.parse(row.layout)
        : row.layout
      : WorkspaceLayout.createDefault().toServerDTO();
    const settingsData = row.settings
      ? typeof row.settings === 'string'
        ? JSON.parse(row.settings)
        : row.settings
      : WorkspaceSettings.createDefault().toServerDTO();

    return EditorWorkspace.load({
      id: EditorWorkspaceId.of(row.id),
      identityId: row.identity_id,
      name: row.name,
      description: row.description ?? null,
      projectPath: row.project_path ?? row.projectPath ?? '',
      projectType: (row.project_type ?? row.projectType ?? ProjectType.Other) as ProjectType,
      layout: WorkspaceLayout.fromDTO(layoutData),
      settings: WorkspaceSettings.fromDTO(settingsData),
      isActive: row.is_active === 1,
      lastActiveSessionId: row.last_active_session_id ?? null,
      lastAccessedAt: row.last_accessed_at ? new Date(row.last_accessed_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      sessions: [],
    } as any);
  }
}
