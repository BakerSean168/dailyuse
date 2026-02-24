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
    return this.findByIdentityId(workspaceId);
  }

  async findByPath(workspaceId: string, path: string): Promise<Document | null> {
    const data = await this.prisma.document.findFirst({
      where: { identityId: workspaceId, folderPath: path, deletedAt: null },
    });
    return data ? this.toDomain(data) : null;
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
    const documents = await this.findByWorkspaceId(workspaceId);
    return documents.filter((document) =>
      document.indexStatus === IndexStatus.Outdated || document.indexStatus === IndexStatus.Failed,
    );
  }

  async findByIndexStatus(workspaceId: string, status: IndexStatus): Promise<Document[]> {
    const documents = await this.findByWorkspaceId(workspaceId);
    return documents.filter((document) => document.indexStatus === status);
  }

  async findRecentlyModified(workspaceId: string, limit: number): Promise<Document[]> {
    const data = await this.prisma.document.findMany({
      where: { identityId: workspaceId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    return data.map((d: PrismaDocument) => this.toDomain(d));
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
    await this.prisma.document.deleteMany({
      where: { identityId: workspaceId },
    });
  }

  async countByWorkspaceId(workspaceId: string): Promise<number> {
    return this.prisma.document.count({
      where: { identityId: workspaceId, deletedAt: null },
    });
  }

  async countDocumentsNeedingIndex(workspaceId: string): Promise<number> {
    const documents = await this.findDocumentsNeedingIndex(workspaceId);
    return documents.length;
  }

  async findByFolderPath(identityId: string, folderPath: string): Promise<Document[]> {
      const data = await this.prisma.document.findMany({
          where: { identityId, folderPath, deletedAt: null }
      });
      return data.map((d: PrismaDocument) => this.toDomain(d));
  }
}
