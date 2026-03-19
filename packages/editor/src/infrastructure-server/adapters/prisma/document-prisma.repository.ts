import type { PrismaClient, Document as PrismaDocument } from '@dailyuse/database';
import type { IDocumentRepository } from '../../../domain-server/repositories/IDocumentRepository';
import { Document } from '../../../domain-server/entities/document';
import { DocumentLanguage, IndexStatus } from '@dailyuse/contracts/editor';
import { PrismaDocumentMapper } from './mappers/prisma-document-mapper';

export class DocumentPrismaRepository implements IDocumentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(data: PrismaDocument): Document {
    return PrismaDocumentMapper.toDomain(data);
  }

  private toPrisma(document: Document) {
    return PrismaDocumentMapper.toPersistence(document);
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
    return data.map((d: PrismaDocument) => this.toDomain(d));
  }

  async findByWorkspaceId(workspaceId: string): Promise<Document[]> {
    return [];
  }

  async findByPath(workspaceId: string, path: string): Promise<Document | null> {
    return null;
  }

  async findByContentHash(contentHash: string): Promise<Document[]> {
    const data = await this.prisma.document.findMany({
      where: { deletedAt: null },
    });
    return data
      .map((d: PrismaDocument) => this.toDomain(d))
      .filter((document) => document.contentHash === contentHash);
  }

  async findDocumentsNeedingIndex(workspaceId: string): Promise<Document[]> {
    return [];
  }

  async findByIndexStatus(workspaceId: string, status: IndexStatus): Promise<Document[]> {
    return [];
  }

  async findRecentlyModified(workspaceId: string, limit: number): Promise<Document[]> {
    return [];
  }

  async delete(id: string): Promise<void> {
    await this.prisma.document.delete({
      where: { id },
    });
  }

  async saveBatch(documents: Document[]): Promise<void> {
    for (const document of documents) {
      await this.save(document);
    }
  }

  async deleteByWorkspaceId(workspaceId: string): Promise<void> {
    return;
  }

  async countByWorkspaceId(workspaceId: string): Promise<number> {
    return 0;
  }

  async countDocumentsNeedingIndex(workspaceId: string): Promise<number> {
    return 0;
  }

  async findByFolderPath(identityId: string, folderPath: string): Promise<Document[]> {
    return [];
  }
}
