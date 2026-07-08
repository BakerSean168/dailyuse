import type { ProjectType } from '@dailyuse/contracts/editor';
import { EditorWorkspace } from '../../../../domain/aggregates/editor-workspace';
import type { EditorWorkspaceState } from '../../../../domain/aggregates/editor-workspace';
import { EditorWorkspaceId } from '../../../../domain/value-objects/editor-workspace-id';
import { WorkspaceLayout } from '../../../../domain/value-objects/workspace-layout';
import { WorkspaceSettings } from '../../../../domain/value-objects/workspace-settings';

export interface PowerSyncEditorWorkspaceRow {
  id: string;
  identity_id: string;
  name: string;
  description: string | null;
  project_path: string | null;
  project_type: string | null;
  layout: string | null;
  setting: string | null;
  is_active: number | null;
  accessed_at: string | null;
  version: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PowerSyncEditorWorkspaceWriteRow {
  id: string;
  identity_id: string;
  name: string;
  description: string | null;
  project_path: string;
  project_type: string;
  layout: string;
  setting: string;
  is_active: number;
  version: number;
  created_at: string;
  updated_at: string;
  accessed_at: string | null;
  deleted_at: string | null;
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toIso(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return new Date(value).toISOString();
}

export class PowerSyncEditorWorkspaceMapper {
  static toDomain(row: PowerSyncEditorWorkspaceRow): EditorWorkspace {
    const layoutData = parseJson(row.layout, WorkspaceLayout.createDefault().toDTO());
    const settingData = parseJson(row.setting, WorkspaceSettings.createDefault().toDTO());

    return EditorWorkspace.load({
      id: EditorWorkspaceId.of(row.id),
      identityId: row.identity_id,
      name: row.name,
      description: row.description,
      projectPath: row.project_path ?? '',
      projectType: (row.project_type ?? 'Other') as ProjectType,
      layout: WorkspaceLayout.fromDTO(layoutData),
      settings: WorkspaceSettings.fromDTO(settingData),
      isActive: row.is_active === 1,
      lastActiveSessionId: null,
      lastAccessedAt: row.accessed_at ? new Date(row.accessed_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      sessions: [],
    } as unknown as EditorWorkspaceState);
  }

  static toPersistence(workspace: EditorWorkspace): PowerSyncEditorWorkspaceWriteRow {
    const dto = workspace.toServerDTO();
    return {
      id: dto.id,
      identity_id: dto.identityId,
      name: dto.name,
      description: dto.description ?? null,
      project_path: dto.projectPath,
      project_type: dto.projectType,
      layout: JSON.stringify(dto.layout),
      setting: JSON.stringify(dto.settings),
      is_active: dto.isActive ? 1 : 0,
      version: 1,
      created_at: new Date(dto.createdAt).toISOString(),
      updated_at: new Date(dto.updatedAt).toISOString(),
      accessed_at: toIso(dto.lastAccessedAt),
      deleted_at: null,
    };
  }
}
