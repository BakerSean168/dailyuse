import type { IndexStatus } from '@dailyuse/contracts/editor';
import { DocumentLanguage } from '@dailyuse/contracts/editor';
import { Document } from '../../../../domain-server/entities/document';
import { DocumentMetadata } from '../../../../domain-shared/value-objects/document-metadata';

export class DocumentSqliteMapper {
  static toDomain(row: any): Document {
    return Document.load({
      id: row.id,
      workspaceId: row.workspace_id,
      identityId: row.identityId ?? row.identity_id ?? row.workspace_id,
      path: row.path,
      name: row.name ?? row.path?.split('/').pop() ?? '',
      language: row.language ?? DocumentLanguage.Other,
      content: row.content ?? '',
      contentHash: row.content_hash,
      metadata: DocumentMetadata.createEmpty(),
      indexStatus: row.index_status as IndexStatus,
      lastIndexedAt: row.last_indexed_at ? new Date(row.last_indexed_at) : null,
      lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    } as any);
  }
}
