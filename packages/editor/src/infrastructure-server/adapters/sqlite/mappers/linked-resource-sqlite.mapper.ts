import type { LinkedSourceType, LinkedTargetType } from '@dailyuse/contracts/editor';
import { LinkedResource } from '../../../../domain-server/entities/linked-resource';

export class LinkedResourceSqliteMapper {
  static toDomain(row: any): LinkedResource {
    return LinkedResource.load({
      id: row.id,
      workspaceId: row.workspace_id ?? '',
      identityId: row.identityId ?? row.identity_id ?? '',
      sourceDocumentId: row.source_document_id,
      sourceType: row.source_type as LinkedSourceType,
      sourceLine: row.source_line ?? null,
      sourceColumn: row.source_column ?? null,
      targetPath: row.target_path ?? '',
      targetType: row.target_type as LinkedTargetType,
      targetDocumentId: row.target_document_id,
      targetAnchor: row.target_anchor ?? null,
      isValid: row.is_valid === 1,
      lastValidatedAt: row.last_verified_at ? new Date(row.last_verified_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    } as any);
  }
}
