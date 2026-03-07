import type { VersionChangeType } from '@dailyuse/contracts/editor';
import { DocumentVersion } from '../../../../domain-server/entities/document-version';

export class DocumentVersionSqliteMapper {
  static toDomain(row: any): DocumentVersion {
    return DocumentVersion.load({
      id: row.id,
      documentId: row.document_id,
      workspaceId: row.workspace_id ?? row.workspaceId ?? row.workspace_id,
      identityId: row.identity_id ?? row.identityId ?? row.identity_id ?? row.identityId,
      versionNumber: row.version_number,
      changeType: row.change_type as VersionChangeType,
      contentHash: row.content_hash ?? row.contentHash ?? '',
      contentDiff: row.content_diff ?? null,
      changeDescription: row.change_description ?? null,
      previousVersionId: row.previous_version_id ?? null,
      createdBy: row.created_by ?? null,
      createdAt: new Date(row.created_at),
    } as any);
  }
}
