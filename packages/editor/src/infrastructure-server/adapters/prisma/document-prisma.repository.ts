import type { PrismaClient } from '@dailyuse/database';
import type { IDocumentRepository } from '../../../domain-server/repositories/IDocumentRepository';
import { Document } from '../../../domain-server/entities/document';
import { DocumentLanguage, IndexStatus } from '@dailyuse/contracts/editor';

export class DocumentPrismaRepository implements IDocumentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(data: any): Document {
    const mappedIndexStatus = this.mapPrismaStatusToIndexStatus(data.status);
    return Document.fromPersistenceDTO({
      id: data.id,
      workspace_id: data.identityId,
      identityId: data.identityId,
      path: data.folderPath,
      name: data.title,
      language: DocumentLanguage.Other,
      content: data.content,
      content_hash: this.hashContent(data.content),
      metadata: JSON.stringify({
        tags: Array.isArray(data.tags) ? data.tags : [],
        category: null,
        wordCount: null,
        characterCount: null,
        readingTime: null,
        encoding: null,
        language: null,
        customFields: null,
      }),
      index_status: mappedIndexStatus,
      last_indexed_at: data.lastVersionedAt,
      last_modified_at: data.lastEditedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  private toPrisma(document: Document) {
    const dto = document.toPersistenceDTO();
    return {
      id: dto.id,
      identityId: dto.identityId,
      title: dto.name,
      content: dto.content,
      folderPath: dto.path,
      tags: this.readMetadataTags(dto.metadata),
      status: this.mapIndexStatusToPrismaStatus(dto.index_status),
      currentVersion: 0,
      lastVersionedAt: dto.last_indexed_at,
      lastEditedAt: dto.last_modified_at,
      version: 1,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: null,
    };
  }

  private readMetadataTags(metadata: string): string[] {
    try {
      const parsed = JSON.parse(metadata);
      return Array.isArray(parsed?.tags) ? parsed.tags : [];
    } catch {
      return [];
    }
  }

  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private mapPrismaStatusToIndexStatus(status: string): IndexStatus {
    if (status === 'PUBLISHED') return IndexStatus.Indexed;
    if (status === 'ARCHIVED') return IndexStatus.Outdated;
    return IndexStatus.NotIndexed;
  }

  private mapIndexStatusToPrismaStatus(status: IndexStatus): string {
    if (status === IndexStatus.Indexed) return 'PUBLISHED';
    if (status === IndexStatus.Outdated || status === IndexStatus.Failed) return 'ARCHIVED';
    return 'DRAFT';
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
      .map((d: any) => this.toDomain(d))
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
    return data.map((d: any) => this.toDomain(d));
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
      return data.map((d: any) => this.toDomain(d));
  }
}
