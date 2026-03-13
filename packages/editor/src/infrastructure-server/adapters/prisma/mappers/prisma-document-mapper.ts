/**
 * Prisma Document Mapper
 *
 * Maps between Document domain entity and Prisma model.
 * Handles metadata JSON parsing, index status mapping, and content hashing.
 */

import type { Document as PrismaDocument } from '@dailyuse/database';
import { Document } from '@/domain-server/entities/document';
import { DocumentLanguage, IndexStatus } from '@dailyuse/contracts/editor';
import { DocumentMetadata } from '@/domain-shared/value-objects/document-metadata';

export class PrismaDocumentMapper {
  /** Maps a Prisma Document row to a Domain Document entity. */
  static toDomain(data: PrismaDocument): Document {
    const mappedIndexStatus = PrismaDocumentMapper.mapPrismaStatusToIndexStatus(data.status);
    return Document.load({
      id: data.id,
      workspaceId: data.identityId,
      identityId: data.identityId,
      path: data.folderPath,
      name: data.title,
      language: DocumentLanguage.Other,
      content: data.content,
      contentHash: PrismaDocumentMapper.hashContent(data.content),
      metadata: DocumentMetadata.fromDTO({
        tags: Array.isArray(data.tags) ? data.tags : [],
        category: null,
        wordCount: null,
        characterCount: null,
        readingTime: null,
        encoding: null,
        language: null,
        customFields: null,
      }),
      indexStatus: mappedIndexStatus,
      lastIndexedAt: data.lastVersionedAt,
      lastModifiedAt: data.lastEditedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as any);
  }

  /** Maps a Domain Document entity to Prisma write data. */
  static toPersistence(document: Document) {
    const dto = document.toServerDTO();
    return {
      id: dto.id,
      identityId: dto.identityId,
      title: dto.name,
      content: dto.content,
      folderPath: dto.path,
      tags: dto.metadata?.tags ?? [],
      status: PrismaDocumentMapper.mapIndexStatusToPrismaStatus(dto.indexStatus),
      currentVersion: 0,
      lastVersionedAt: dto.lastIndexedAt ? new Date(dto.lastIndexedAt) : null,
      lastEditedAt: dto.lastModifiedAt ? new Date(dto.lastModifiedAt) : null,
      version: 1,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: null,
    };
  }

  /** Maps a Prisma status string to a Domain IndexStatus. */
  static mapPrismaStatusToIndexStatus(status: string): IndexStatus {
    if (status === 'PUBLISHED') return IndexStatus.Indexed;
    if (status === 'ARCHIVED') return IndexStatus.Outdated;
    return IndexStatus.NotIndexed;
  }

  /** Maps a Domain IndexStatus to a Prisma status string. */
  static mapIndexStatusToPrismaStatus(indexStatus: IndexStatus): string {
    if (indexStatus === IndexStatus.Indexed) return 'PUBLISHED';
    if (indexStatus === IndexStatus.Outdated || indexStatus === IndexStatus.Failed)
      return 'ARCHIVED';
    return 'DRAFT';
  }

  /**
   * Hash content for change detection (simple bitwise hash)
   */
  static hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /** Batch converts Prisma Document rows to Domain entities. */
  static toDomainList(rows: PrismaDocument[]): Document[] {
    return rows.map((row) => PrismaDocumentMapper.toDomain(row));
  }
}
