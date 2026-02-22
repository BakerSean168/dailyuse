/**
 * Prisma EditorWorkspace Mapper
 *
 * Maps between EditorWorkspace domain aggregate and Prisma model.
 * Handles JSON serialization for layout/settings and Date conversions.
 */

import type { EditorWorkspace as PrismaEditorWorkspace } from '@dailyuse/database';
import type { ProjectType } from '@dailyuse/contracts/editor';
import { EditorWorkspace } from '../../../domain-server/aggregates/editor-workspace';
import { EditorWorkspaceId } from '../../../domain-shared';
import { WorkspaceLayout } from '../../../domain-shared/value-objects/workspace-layout';
import { WorkspaceSettings } from '../../../domain-shared/value-objects/workspace-settings';

export class PrismaEditorWorkspaceMapper {
  /**
   * Prisma EditorWorkspace → Domain EditorWorkspace aggregate
   */
  static toDomain(data: PrismaEditorWorkspace): EditorWorkspace {
    const layoutData = typeof data.layout === 'string' ? JSON.parse(data.layout as string) : data.layout;
    const settingsData = typeof data.setting === 'string' ? JSON.parse(data.setting as string) : data.setting;

    return EditorWorkspace.load({
      id: EditorWorkspaceId.of(data.id),
      identityId: data.identityId,
      name: data.name,
      description: data.description,
      projectPath: data.projectPath,
      projectType: data.projectType as ProjectType,
      layout: WorkspaceLayout.fromDTO(layoutData),
      settings: WorkspaceSettings.fromDTO(settingsData),
      isActive: data.isActive,
      lastActiveSessionId: null,
      lastAccessedAt: data.accessedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      sessions: [],
    } as any);
  }

  /**
   * Domain EditorWorkspace → Prisma write data
   */
  static toPersistence(workspace: EditorWorkspace) {
    const dto = workspace.toServerDTO();
    return {
      id: dto.id,
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description,
      projectPath: dto.projectPath,
      projectType: dto.projectType,
      layout: dto.layout,
      setting: dto.settings,
      isActive: dto.isActive,
      accessedAt: dto.lastAccessedAt ? new Date(dto.lastAccessedAt) : new Date(),
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    };
  }

  /**
   * Batch conversion: Prisma → Domain
   */
  static toDomainList(rows: PrismaEditorWorkspace[]): EditorWorkspace[] {
    return rows.map((row) => PrismaEditorWorkspaceMapper.toDomain(row));
  }
}
