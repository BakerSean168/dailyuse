/**
 * LinkedResource Entity - Server Interface
 * 链接资源实体 - 服务端接�?
 */

import type { LinkedResourceId, EditorWorkspaceId, IdentityId, DocumentId, TransferDate, DomainDate, PersistenceDate } from '@/primitives';
import type { LinkedSourceType } from '../value-objects/linked-source-type';
import type { LinkedTargetType } from '../value-objects/linked-target-type';
import type { LinkedResourceClientDTO } from './linked-resource-client';

/**
 * Linked Resource Server DTO
 * 链接资源服务�?DTO
 */
export interface LinkedResourceServerDTO {
  id: LinkedResourceId;
  workspaceId: EditorWorkspaceId; // 所属工作区 ID（聚合根外键�?
  identityId: IdentityId;
  sourceDocumentId: DocumentId; // 源文�?ID
  sourceType: LinkedSourceType;
  sourceLine: number | null; // 源位置（行号�?
  sourceColumn: number | null; // 源位置（列号�?
  targetPath: string; // 目标路径（可能是相对路径或绝对路径）
  targetType: LinkedTargetType;
  targetDocumentId: DocumentId | null; // 目标文档 ID（如果是内部文档�?
  targetAnchor: string | null; // 目标锚点（如 #heading-id�?
  isValid: boolean; // 链接是否有效（目标是否存在）
  lastValidatedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * Linked Resource Persistence DTO
 * 链接资源持久�?DTO（数据库字段，snake_case�?
 */
export interface LinkedResourcePersistenceDTO {
  id: LinkedResourceId;
  workspace_id: EditorWorkspaceId;
  identityId: IdentityId;
  source_document_id: DocumentId;
  source_type: LinkedSourceType;
  source_line: number | null;
  source_column: number | null;
  target_path: string;
  target_type: LinkedTargetType;
  target_document_id: DocumentId | null;
  target_anchor: string | null;
  is_valid: boolean;
  last_validated_at: PersistenceDate | null;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}
