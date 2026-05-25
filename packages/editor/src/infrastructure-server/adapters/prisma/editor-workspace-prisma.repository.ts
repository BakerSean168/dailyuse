import type { Prisma, PrismaClient, EditorWorkspace as PrismaEditorWorkspace } from '@dailyuse/database';
import type { IEditorWorkspaceRepository } from '../../../domain-server/repositories/i-editor-workspace-repository';
import { EditorWorkspace } from '../../../domain-server/aggregates/editor-workspace';
import { PrismaEditorWorkspaceMapper } from './mappers/prisma-editor-workspace-mapper';
import { createEventBusAdapter, publishAggregateEvents } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils';

const eventBusAdapter = createEventBusAdapter(eventBus);

export class EditorWorkspacePrismaRepository implements IEditorWorkspaceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(data: PrismaEditorWorkspace): EditorWorkspace {
    return PrismaEditorWorkspaceMapper.toDomain(data);
  }

  private toPrisma(workspace: EditorWorkspace) {
    return PrismaEditorWorkspaceMapper.toPersistence(workspace);
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
    return data.map((d: PrismaEditorWorkspace) => this.toDomain(d));
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
    const { id: _id, createdAt: _createdAt, ...updateData } = data;
    await this.prisma.editorWorkspace.upsert({
      where: { id: data.id },
      create: data,
      update: updateData as Prisma.EditorWorkspaceUncheckedUpdateInput,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.editorWorkspace.delete({
      where: { id },
    });
  }

  async deleteAggregate(workspace: EditorWorkspace): Promise<void> {
    await this.prisma.editorWorkspace.delete({
      where: { id: workspace.id },
    });
    await publishAggregateEvents(workspace, eventBusAdapter);
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
