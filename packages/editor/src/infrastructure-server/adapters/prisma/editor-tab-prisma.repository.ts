import type {
  PrismaClient,
  EditorWorkspaceSessionGroupTab as PrismaEditorWorkspaceSessionGroupTab,
} from '@dailyuse/database';
import type { IEditorTabRepository } from '../../../domain-server/repositories/IEditorTabRepository';
import { EditorTab } from '../../../domain-server/entities/editor-tab';

function toDomain(row: PrismaEditorWorkspaceSessionGroupTab): EditorTab {
  return EditorTab.load({
    id: row.id as any,
    groupId: row.groupId as any,
    sessionId: row.sessionId as any,
    workspaceId: row.workspaceId as any,
    identityId: row.identityId as any,
    resourceId: row.resourceId,
    tabIndex: row.tabIndex,
    tabType: row.tabType as any,
    name: row.title,
    viewState: (row.viewState as any) ?? {
      scrollTop: 0,
      scrollLeft: 0,
      cursorPosition: { line: 1, column: 1 },
      selections: null,
    },
    isPinned: row.isPinned,
    isActive: row.isActive,
    isDirty: false,
    lastAccessedAt: null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export class EditorTabPrismaRepository implements IEditorTabRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<EditorTab | null> {
    const row = await this.prisma.editorWorkspaceSessionGroupTab.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByGroupId(groupId: string): Promise<EditorTab[]> {
    const rows = await this.prisma.editorWorkspaceSessionGroupTab.findMany({
      where: { groupId, deletedAt: null },
      orderBy: { tabIndex: 'asc' },
    });
    return rows.map(toDomain);
  }

  async findByResourceId(resourceId: string): Promise<EditorTab[]> {
    const rows = await this.prisma.editorWorkspaceSessionGroupTab.findMany({
      where: { resourceId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map(toDomain);
  }

  async findByGroupIdAndTabIndex(groupId: string, tabIndex: number): Promise<EditorTab | null> {
    const row = await this.prisma.editorWorkspaceSessionGroupTab.findFirst({
      where: { groupId, tabIndex, deletedAt: null },
    });
    return row ? toDomain(row) : null;
  }

  async findPinnedByGroupId(groupId: string): Promise<EditorTab[]> {
    const rows = await this.prisma.editorWorkspaceSessionGroupTab.findMany({
      where: { groupId, isPinned: true, deletedAt: null },
      orderBy: { tabIndex: 'asc' },
    });
    return rows.map(toDomain);
  }

  async findDirtyByGroupId(_groupId: string): Promise<EditorTab[]> {
    return [];
  }

  async findRecentlyAccessed(groupId: string, limit: number): Promise<EditorTab[]> {
    const rows = await this.prisma.editorWorkspaceSessionGroupTab.findMany({
      where: { groupId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    return rows.map(toDomain);
  }

  async save(tab: EditorTab): Promise<void> {
    const dto = tab.toServerDTO();
    await this.prisma.editorWorkspaceSessionGroupTab.upsert({
      where: { id: dto.id },
      create: {
        id: dto.id,
        groupId: dto.groupId,
        sessionId: dto.sessionId,
        workspaceId: dto.workspaceId,
        identityId: dto.identityId,
        resourceId: dto.resourceId,
        tabIndex: dto.tabIndex,
        tabType: dto.tabType,
        title: dto.name,
        viewState: dto.viewState as any,
        isPinned: dto.isPinned,
        isActive: dto.isActive,
        createdAt: new Date(dto.createdAt),
        updatedAt: new Date(dto.updatedAt),
      },
      update: {
        groupId: dto.groupId,
        sessionId: dto.sessionId,
        workspaceId: dto.workspaceId,
        identityId: dto.identityId,
        resourceId: dto.resourceId,
        tabIndex: dto.tabIndex,
        tabType: dto.tabType,
        title: dto.name,
        viewState: dto.viewState as any,
        isPinned: dto.isPinned,
        isActive: dto.isActive,
        updatedAt: new Date(dto.updatedAt),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.editorWorkspaceSessionGroupTab.delete({ where: { id } });
  }

  async saveBatch(tabs: EditorTab[]): Promise<void> {
    for (const tab of tabs) {
      await this.save(tab);
    }
  }

  async deleteByGroupId(groupId: string): Promise<void> {
    await this.prisma.editorWorkspaceSessionGroupTab.deleteMany({ where: { groupId } });
  }

  async deleteByResourceId(resourceId: string): Promise<void> {
    await this.prisma.editorWorkspaceSessionGroupTab.deleteMany({
      where: { resourceId },
    });
  }

  async countByGroupId(groupId: string): Promise<number> {
    return this.prisma.editorWorkspaceSessionGroupTab.count({
      where: { groupId, deletedAt: null },
    });
  }

  async countDirtyByGroupId(_groupId: string): Promise<number> {
    return 0;
  }

  async getMaxTabIndex(groupId: string): Promise<number> {
    const row = await this.prisma.editorWorkspaceSessionGroupTab.findFirst({
      where: { groupId, deletedAt: null },
      orderBy: { tabIndex: 'desc' },
    });
    return row?.tabIndex ?? -1;
  }
}
