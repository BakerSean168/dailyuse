import type { PrismaClient } from '@dailyuse/database';
import type { IEditorWorkspaceRepository } from '../../../../domain-server/repositories/IEditorWorkspaceRepository';
import { EditorWorkspace } from '../../../../domain-server/aggregates/editor-workspace';

export class EditorWorkspacePrismaRepository implements IEditorWorkspaceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(data: any): EditorWorkspace {
    return EditorWorkspace.fromPersistenceDTO({
      id: data.id,
      identityId: data.identityId,
      name: data.name,
      description: data.description,
      project_path: data.projectPath,
      project_type: data.projectType,
      layout: JSON.stringify(data.layout),
      settings: JSON.stringify(data.setting),
      is_active: data.isActive,
      last_active_session_id: null,
      lastAccessedAt: data.accessedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  private toPrisma(workspace: EditorWorkspace) {
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

  async findById(id: string): Promise<EditorWorkspace | null> {
    const data = await this.prisma.editorWorkspace.findUnique({
      where: { id },
    });
    return data ? this.toDomain(data) : null;
  }

  async findByIdentityId(identityId: string): Promise<EditorWorkspace[]> {
    const data = await this.prisma.editorWorkspace.findMany({
      where: { identityId, deletedAt: null },
    });
    return data.map((d: any) => this.toDomain(d));
  }

  async findByIdentityIdAndName(identityId: string, name: string): Promise<EditorWorkspace | null> {
    const data = await this.prisma.editorWorkspace.findFirst({
      where: { identityId, name, deletedAt: null },
    });
    return data ? this.toDomain(data) : null;
  }

  async findActiveByIdentityId(identityId: string): Promise<EditorWorkspace | null> {
    const data = await this.prisma.editorWorkspace.findFirst({
      where: { identityId, isActive: true, deletedAt: null },
    });
    return data ? this.toDomain(data) : null;
  }

  async save(workspace: EditorWorkspace): Promise<void> {
    const data = this.toPrisma(workspace);
    await this.prisma.editorWorkspace.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.editorWorkspace.delete({
      where: { id },
    });
  }

  async saveBatch(workspaces: EditorWorkspace[]): Promise<void> {
    for (const workspace of workspaces) {
      await this.save(workspace);
    }
  }

  async existsByName(identityId: string, name: string): Promise<boolean> {
    const count = await this.prisma.editorWorkspace.count({
      where: { identityId, name, deletedAt: null },
    });
    return count > 0;
  }

  async countByIdentityId(identityId: string): Promise<number> {
    return this.prisma.editorWorkspace.count({
      where: { identityId, deletedAt: null },
    });
  }
}
