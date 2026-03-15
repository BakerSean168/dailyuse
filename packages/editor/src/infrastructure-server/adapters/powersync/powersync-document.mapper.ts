import { DocumentLanguage, IndexStatus } from '@dailyuse/contracts/editor';
import { Document } from '../../../domain-server/entities/document';
import { DocumentMetadata } from '../../../domain-shared/value-objects/document-metadata';

export interface PowerSyncDocumentRow {
  id: string;
  identity_id: string;
  title: string;
  content: string;
  folder_path: string;
  tags: string | null;
  status: string;
  last_versioned_at: string | null;
  last_edited_at: string | null;
  created_at: string;
  updated_at: string;
}

export class PowerSyncDocumentMapper {
  static toDomain(row: PowerSyncDocumentRow): Document {
    return Document.load({
      id: row.id as any,
      workspaceId: row.identity_id as any,
      identityId: row.identity_id as any,
      path: row.folder_path,
      name: row.title,
      language: DocumentLanguage.Other,
      content: row.content,
      contentHash: PowerSyncDocumentMapper.hashContent(row.content),
      metadata: DocumentMetadata.fromDTO({
        tags: row.tags ? JSON.parse(row.tags) : [],
        category: null,
        wordCount: null,
        characterCount: null,
        readingTime: null,
        encoding: null,
        language: null,
        customFields: null,
      }),
      indexStatus: PowerSyncDocumentMapper.mapRowStatus(row.status),
      lastIndexedAt: row.last_versioned_at ? new Date(row.last_versioned_at) : null,
      lastModifiedAt: row.last_edited_at ? new Date(row.last_edited_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  static toPersistence(document: Document) {
    const dto = document.toServerDTO();
    return {
      id: dto.id,
      identity_id: dto.workspaceId,
      title: dto.name,
      content: dto.content,
      folder_path: dto.path,
      tags: JSON.stringify(dto.metadata?.tags ?? []),
      status: PowerSyncDocumentMapper.mapIndexStatus(dto.indexStatus),
      last_versioned_at: dto.lastIndexedAt ? new Date(dto.lastIndexedAt).toISOString() : null,
      last_edited_at: dto.lastModifiedAt ? new Date(dto.lastModifiedAt).toISOString() : null,
      created_at: new Date(dto.createdAt).toISOString(),
      updated_at: new Date(dto.updatedAt).toISOString(),
    };
  }

  private static mapRowStatus(status: string): IndexStatus {
    if (status === 'PUBLISHED') return IndexStatus.Indexed;
    if (status === 'ARCHIVED') return IndexStatus.Outdated;
    return IndexStatus.NotIndexed;
  }

  private static mapIndexStatus(status: IndexStatus): string {
    if (status === IndexStatus.Indexed) return 'PUBLISHED';
    if (status === IndexStatus.Outdated || status === IndexStatus.Failed) return 'ARCHIVED';
    return 'DRAFT';
  }

  private static hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return hash.toString(16);
  }
}
