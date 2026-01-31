/**
 * DocumentVersion Entity - Client Interface
 * 文档版本实体 - 客户端接�?
 */

import type { DocumentVersionId, DocumentId, EditorWorkspaceId, IdentityId, TransferDate, DomainDate } from '@/primitives';
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

/**
 * Document Version Entity - Client Interface
 * 文档版本实体 - 客户端接�?
 */
export interface DocumentVersionClient {
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

  // ===== UI 辅助方法 =====

  /**
   * 获取变更类型标签
   */

  /**
   * 获取变更类型颜色
   */

  /**
   * 获取版本显示名称（如 "v1", "v2"�?
   */

  /**
   * 是否为首个版�?
   */

  /**
   * 是否有变更描�?
   */

  /**
   * 获取创建者显示名称（如果没有则返回默认值）
   */

}
