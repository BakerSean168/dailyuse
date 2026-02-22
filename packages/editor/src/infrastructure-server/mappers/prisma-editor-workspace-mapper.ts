/**
 * Prisma EditorWorkspace Mapper
 *
 * Maps between EditorWorkspace domain aggregate and Prisma model.
 * Handles JSON serialization for layout/settings and Date conversions.
 */

import type { EditorWorkspace as PrismaEditorWorkspace } from '@dailyuse/database';
import type { ProjectType } from '@dailyuse/contracts/editor';
import { EditorWorkspace } from '../../../domain-server/aggregates/editor-workspace';

export class PrismaEditorWorkspaceMapper {
  /**
   * Prisma EditorWorkspace → Domain EditorWorkspace aggregate
   */
  static toDomain(data: PrismaEditorWorkspace): EditorWorkspace {
    return EditorWorkspace.fromPersistenceDTO({
      id: data.id,
      identityId: data.identityId,
      name: data.name,
      description: data.description,
      project_path: data.projectPath,
      project_type: data.projectType as ProjectType,
      layout: JSON.stringify(data.layout),
      settings: JSON.stringify(data.setting),
      is_active: data.isActive,
      last_active_session_id: null,
      lastAccessedAt: data.accessedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * Domain EditorWorkspace → Prisma write data
   */
  static toPersistence(workspace: EditorWorkspace) {
    const dto = workspace.toPersistenceDTO();
    return {
      id: dto.id,
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description,
      projectPath: dto.project_path,
      projectType: dto.project_type,
      layout: JSON.parse(dto.layout),
      setting: JSON.parse(dto.settings),
      isActive: dto.is_active,
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
