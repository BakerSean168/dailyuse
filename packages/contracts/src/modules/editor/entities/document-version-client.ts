/**
 * DocumentVersion Entity - Client Interface
 * 文档版本实体 - 客户端接�?
 */

import type { DocumentVersionId, DocumentId, EditorWorkspaceId, IdentityId, TransferDate, DomainDate } from '../../../primitives';
import type { VersionChangeType } from '../value-objects/version-change-type';
import type { DocumentVersionServerDTO } from './document-version-server';

/**
 * Document Version Client DTO
 * 文档版本客户�?DTO（包�?UI 格式化字段）
 */
export interface DocumentVersionClientDTO {
  id: string;
  documentId: string;
  workspaceId: string;
  identityId: string;
  versionNumber: number;
  changeType: VersionChangeType;
  contentHash: string;
  contentDiff: string | null;
  changeDescription: string | null;
  previousVersionId: string | null;
  createdBy: string | null;
  createdAt: TransferDate;

  // UI 格式化字�?
  formattedCreatedAt: string;
}
