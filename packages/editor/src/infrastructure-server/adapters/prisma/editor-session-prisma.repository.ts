import type {
  PrismaClient,
  EditorWorkspaceSession as PrismaEditorWorkspaceSession,
} from '@dailyuse/database';
import type { IEditorSessionRepository } from '../../../domain-server/repositories/IEditorSessionRepository';
import { EditorSession } from '../../../domain-server/entities/editor-session';
import { parseSessionLayoutFromPersistence } from '../shared/session-layout.persistence';

function toDomain(row: PrismaEditorWorkspaceSession): EditorSession {
  const layout = parseSessionLayoutFromPersistence(row.layout);

  return EditorSession.load({
    id: row.id as any,
    workspaceId: row.workspaceId as any,
    identityId: row.identityId as any,
    name: row.name,
    description: null,
    layout,
    isActive: row.isActive,
    activeGroupIndex: layout.activeGroupIndex,
    groups: [],
    lastAccessedAt: null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export class EditorSessionPrismaRepository implements IEditorSessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<EditorSession | null> {
    const row = await this.prisma.editorWorkspaceSession.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByWorkspaceId(workspaceId: string): Promise<EditorSession[]> {
    const rows = await this.prisma.editorWorkspaceSession.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toDomain);
  }

  async findByWorkspaceIdAndName(workspaceId: string, name: string): Promise<EditorSession | null> {
    const row = await this.prisma.editorWorkspaceSession.findFirst({
      where: { workspaceId, name, deletedAt: null },
    });
    return row ? toDomain(row) : null;
  }

  async findActiveByWorkspaceId(workspaceId: string): Promise<EditorSession | null> {
    const row = await this.prisma.editorWorkspaceSession.findFirst({
      where: { workspaceId, isActive: true, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });
    return row ? toDomain(row) : null;
  }

  async save(session: EditorSession): Promise<void> {
    const dto = session.toServerDTO();
    await this.prisma.editorWorkspaceSession.upsert({
      where: { id: dto.id },
      create: {
        id: dto.id,
        workspaceId: dto.workspaceId,
        identityId: dto.identityId,
        name: dto.name,
        layout: dto.layout as any,
        isActive: dto.isActive,
        createdAt: new Date(dto.createdAt),
        updatedAt: new Date(dto.updatedAt),
      },
      update: {
        workspaceId: dto.workspaceId,
        identityId: dto.identityId,
        name: dto.name,
        layout: dto.layout as any,
        isActive: dto.isActive,
        updatedAt: new Date(dto.updatedAt),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.editorWorkspaceSession.delete({ where: { id } });
  }

  async saveBatch(sessions: EditorSession[]): Promise<void> {
    for (const session of sessions) {
      await this.save(session);
    }
  }

  async deleteByWorkspaceId(workspaceId: string): Promise<void> {
    await this.prisma.editorWorkspaceSession.deleteMany({ where: { workspaceId } });
  }

  async countByWorkspaceId(workspaceId: string): Promise<number> {
    return this.prisma.editorWorkspaceSession.count({ where: { workspaceId, deletedAt: null } });
  }
}
