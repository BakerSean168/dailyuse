import type {
  PrismaClient,
  EditorWorkspaceSessionGroup as PrismaEditorWorkspaceSessionGroup,
} from '@dailyuse/database';
import { SplitDirection } from '@dailyuse/contracts/editor';
import type { IEditorGroupRepository } from '../../../domain-server/repositories/i-editor-group-repository';
import { EditorGroup } from '../../../domain-server/entities/editor-group';

function toDomain(row: PrismaEditorWorkspaceSessionGroup): EditorGroup {
  return EditorGroup.load({
    id: row.id as any,
    sessionId: row.sessionId as any,
    workspaceId: row.workspaceId as any,
    identityId: row.identityId as any,
    groupIndex: row.groupIndex,
    activeTabIndex: 0,
    name: row.name,
    tabs: [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export class EditorGroupPrismaRepository implements IEditorGroupRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<EditorGroup | null> {
    const row = await this.prisma.editorWorkspaceSessionGroup.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findBySessionId(sessionId: string): Promise<EditorGroup[]> {
    const rows = await this.prisma.editorWorkspaceSessionGroup.findMany({
      where: { sessionId, deletedAt: null },
      orderBy: { groupIndex: 'asc' },
    });
    return rows.map(toDomain);
  }

  async findBySessionIdAndGroupIndex(
    sessionId: string,
    groupIndex: number,
  ): Promise<EditorGroup | null> {
    const row = await this.prisma.editorWorkspaceSessionGroup.findFirst({
      where: { sessionId, groupIndex, deletedAt: null },
    });
    return row ? toDomain(row) : null;
  }

  async save(group: EditorGroup): Promise<void> {
    const dto = group.toServerDTO();
    await this.prisma.editorWorkspaceSessionGroup.upsert({
      where: { id: dto.id },
      create: {
        id: dto.id,
        sessionId: dto.sessionId,
        workspaceId: dto.workspaceId,
        identityId: dto.identityId,
        groupIndex: dto.groupIndex,
        name: dto.name,
        splitDirection: SplitDirection.Horizontal,
        createdAt: new Date(dto.createdAt),
        updatedAt: new Date(dto.updatedAt),
      },
      update: {
        sessionId: dto.sessionId,
        workspaceId: dto.workspaceId,
        identityId: dto.identityId,
        groupIndex: dto.groupIndex,
        name: dto.name,
        updatedAt: new Date(dto.updatedAt),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.editorWorkspaceSessionGroup.delete({ where: { id } });
  }

  async saveBatch(groups: EditorGroup[]): Promise<void> {
    for (const group of groups) {
      await this.save(group);
    }
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    await this.prisma.editorWorkspaceSessionGroup.deleteMany({ where: { sessionId } });
  }

  async countBySessionId(sessionId: string): Promise<number> {
    return this.prisma.editorWorkspaceSessionGroup.count({ where: { sessionId, deletedAt: null } });
  }

  async getMaxGroupIndex(sessionId: string): Promise<number> {
    const row = await this.prisma.editorWorkspaceSessionGroup.findFirst({
      where: { sessionId, deletedAt: null },
      orderBy: { groupIndex: 'desc' },
    });
    return row?.groupIndex ?? -1;
  }
}
