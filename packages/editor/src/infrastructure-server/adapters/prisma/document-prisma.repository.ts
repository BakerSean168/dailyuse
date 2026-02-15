import type { PrismaClient } from '@dailyuse/database';
import type { IDocumentRepository } from '../../../domain-server/repositories/IDocumentRepository';
import { Document } from '../../../domain-server/entities/document';

export class DocumentPrismaRepository implements IDocumentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(data: any): Document {
    return Document.fromPersistenceDTO({
      id: data.id,
      identityId: data.identityId,
      title: data.title,
      content: data.content,
      folder_path: data.folderPath,
      tags: JSON.stringify(data.tags),
      status: data.status,
      current_version: data.currentVersion,
      last_versioned_at: data.lastVersionedAt,
      last_edited_at: data.lastEditedAt,
      edit_session_id: data.editSessionId,
      version: data.version,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
    });
  }

  private toPrisma(document: Document) {
    const dto = document.toPersistenceDTO();
    return {
      id: dto.id,
      identityId: dto.identityId,
      title: dto.title,
      content: dto.content,
      folderPath: dto.folder_path,
      tags: JSON.parse(dto.tags),
      status: dto.status,
      currentVersion: dto.current_version,
      lastVersionedAt: dto.last_versioned_at,
      lastEditedAt: dto.last_edited_at,
      editSessionId: dto.edit_session_id,
      version: dto.version,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    };
  }

  async save(document: Document): Promise<void> {
    const data = this.toPrisma(document);
    await this.prisma.document.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async findById(id: string): Promise<Document | null> {
    const data = await this.prisma.document.findUnique({
      where: { id },
    });
    return data ? this.toDomain(data) : null;
  }

  async findByIdentityId(identityId: string): Promise<Document[]> {
    const data = await this.prisma.document.findMany({
      where: { identityId, deletedAt: null },
    });
    return data.map((d: any) => this.toDomain(d));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.document.delete({
      where: { id },
    });
  }

  async findByFolderPath(identityId: string, folderPath: string): Promise<Document[]> {
      const data = await this.prisma.document.findMany({
          where: { identityId, folderPath, deletedAt: null }
      });
      return data.map((d: any) => this.toDomain(d));
  }
}
