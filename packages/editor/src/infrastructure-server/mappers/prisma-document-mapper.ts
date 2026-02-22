/**
 * Prisma Document Mapper
 *
 * Maps between Document domain entity and Prisma model.
 * Handles metadata JSON parsing, index status mapping, and content hashing.
 */

import type { Document as PrismaDocument } from '@dailyuse/database';
import { Document } from '../../../domain-server/entities/document';
import { DocumentLanguage, IndexStatus } from '@dailyuse/contracts/editor';
import { createHash } from 'crypto';

export class PrismaDocumentMapper {
  /**
   * Prisma Document → Domain Document entity
   */
  static toDomain(data: PrismaDocument): Document {
    const mappedIndexStatus = PrismaDocumentMapper.mapPrismaStatusToIndexStatus(data.status);
    return Document.fromPersistenceDTO({
      id: data.id,
      workspace_id: data.identityId,
      identityId: data.identityId,
      path: data.folderPath,
      name: data.title,
      language: DocumentLanguage.Other,
      content: data.content,
      content_hash: PrismaDocumentMapper.hashContent(data.content),
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

  /**
   * Domain Document → Prisma write data
   */
  static toPersistence(document: Document) {
    const dto = document.toPersistenceDTO();
    return {
      id: dto.id,
      identityId: dto.identityId,
      title: dto.name,
      content: dto.content,
      folderPath: dto.path,
      tags: PrismaDocumentMapper.readMetadataTags(dto.metadata),
      status: PrismaDocumentMapper.mapIndexStatusToPrismaStatus(dto.index_status),
      currentVersion: 0,
      lastVersionedAt: dto.last_indexed_at,
      lastEditedAt: dto.last_modified_at,
      version: 1,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: null,
    };
  }

  /**
   * Read tags from metadata JSON string
   */
  static readMetadataTags(metadata: string): string[] {
    try {
      const parsed = JSON.parse(metadata);
      return Array.isArray(parsed.tags) ? parsed.tags : [];
    } catch {
      return [];
    }
  }

  /**
   * Map Prisma status → Domain IndexStatus
   */
  static mapPrismaStatusToIndexStatus(status: string): IndexStatus {
    switch (status) {
      case 'DRAFT':
        return IndexStatus.Pending;
      case 'PUBLISHED':
        return IndexStatus.Indexed;
      case 'ARCHIVED':
        return IndexStatus.Stale;
      default:
        return IndexStatus.Pending;
    }
  }

  /**
   * Map Domain IndexStatus → Prisma status string
   */
  static mapIndexStatusToPrismaStatus(indexStatus: IndexStatus): string {
    switch (indexStatus) {
      case IndexStatus.Indexed:
        return 'PUBLISHED';
      case IndexStatus.Stale:
        return 'ARCHIVED';
      case IndexStatus.Pending:
      default:
        return 'DRAFT';
    }
  }

  /**
   * Hash content for change detection
   */
  static hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Batch conversion: Prisma → Domain
   */
  static toDomainList(rows: PrismaDocument[]): Document[] {
    return rows.map((row) => PrismaDocumentMapper.toDomain(row));
  }
}
