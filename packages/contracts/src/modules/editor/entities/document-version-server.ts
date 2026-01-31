/**
 * DocumentVersion Entity - Server Interface
 * 文档版本实体 - 服务端接�?
 */

import type { DocumentVersionId, DocumentId, EditorWorkspaceId, IdentityId, TransferDate, DomainDate, PersistenceDate } from '@/primitives';
import type { VersionChangeType } from '../value-objects/version-change-type';
import type { DocumentVersionClientDTO } from './document-version-client';

/**
 * Document Version Server DTO
 * 文档版本服务�?DTO
 */
export interface DocumentVersionServerDTO {
  id: DocumentVersionId;
  documentId: DocumentId; // 所属文�?ID
  workspaceId: EditorWorkspaceId; // 所属工作区 ID（聚合根外键�?
  identityId: IdentityId;
  versionNumber: number; // 版本号（递增�?
  changeType: VersionChangeType;
  contentHash: string; // 内容哈希�?
  contentDiff: string | null; // 内容差异（diff 格式�?
  changeDescription: string | null; // 变更描述
  previousVersionId: DocumentVersionId | null; // 上一个版�?ID
  createdBy: string | null; // 创建�?
  createdAt: TransferDate;
}

/**
 * Document Version Persistence DTO
 * 文档版本持久�?DTO（数据库字段，snake_case�?
 */
export interface DocumentVersionPersistenceDTO {
  id: DocumentVersionId;
  document_id: DocumentId;
  workspace_id: EditorWorkspaceId;
  identityId: IdentityId;
  version_number: number;
  change_type: VersionChangeType;
  content_hash: string;
  content_diff: string | null;
  change_description: string | null;
  previous_version_id: DocumentVersionId | null;
  created_by: string | null;
  createdAt: PersistenceDate;
}

/**
 * Document Version Entity - Server Interface
 * 文档版本实体 - 服务端接�?
 */
export interface DocumentVersionServer {
  // ===== 基础属�?=====
  readonly id: DocumentVersionId;
  readonly documentId: DocumentId;
  readonly workspaceId: EditorWorkspaceId;
  readonly identityId: IdentityId;
  readonly versionNumber: number;
  readonly changeType: VersionChangeType;
  readonly contentHash: string;
  readonly contentDiff: string | null;
  readonly changeDescription: string | null;
  readonly previousVersionId: DocumentVersionId | null;
  readonly createdBy: string | null;
  readonly createdAt: DomainDate;

  // ===== 业务方法 =====

  /**
   * 更新变更描述
   */
  updateDescription(description: string): void;

  /**
   * 判断是否为首个版�?
   */
  isFirstVersion(): boolean;

  /**
   * 判断变更类型是否为编�?
   */
  isEditChange(): boolean;

  /**
   * 判断变更类型是否为创�?
   */
  isCreateChange(): boolean;

  // ===== DTO 转换方法 =====
}
