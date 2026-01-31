/**
 * LinkedResource Entity - Client Interface
 * 链接资源实体 - 客户端接�?
 */

import type { LinkedResourceId, EditorWorkspaceId, IdentityId, DocumentId, TransferDate, DomainDate } from '@/primitives';
import type { LinkedSourceType } from '../value-objects/linked-source-type';
import type { LinkedTargetType } from '../value-objects/linked-target-type';
import type { LinkedResourceServerDTO } from './linked-resource-server';

/**
 * Linked Resource Client DTO
 * 链接资源客户�?DTO（包�?UI 格式化字段）
 */
export interface LinkedResourceClientDTO {
  id: string;
  workspaceId: string;
  identityId: string;
  sourceDocumentId: string;
  sourceType: LinkedSourceType;
  sourceLine: number | null;
  sourceColumn: number | null;
  targetPath: string;
  targetType: LinkedTargetType;
  targetDocumentId: string | null;
  targetAnchor: string | null;
  isValid: boolean;
  lastValidatedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;

  // UI 格式化字�?
  formattedLastValidated: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

/**
 * Linked Resource Entity - Client Interface
 * 链接资源实体 - 客户端接�?
 */
export interface LinkedResourceClient {
  // ===== 基础属�?=====
  readonly id: LinkedResourceId;
  readonly workspaceId: EditorWorkspaceId;
  readonly identityId: IdentityId;
  readonly sourceDocumentId: DocumentId;
  readonly sourceType: LinkedSourceType;
  readonly sourceLine: number | null;
  readonly sourceColumn: number | null;
  readonly targetPath: string;
  readonly targetType: LinkedTargetType;
  readonly targetDocumentId: DocumentId | null;
  readonly targetAnchor: string | null;
  readonly isValid: boolean;
  readonly lastValidatedAt: DomainDate | null;
  readonly createdAt: DomainDate;
  readonly updatedAt: DomainDate;

  // ===== UI 辅助方法 =====

  /**
   * 获取源类型标�?
   */
  getSourceTypeLabel(): string;

  /**
   * 获取目标类型标签
   */
  getTargetTypeLabel(): string;

  /**
   * 获取目标类型图标名称
   */
  getTargetIconName(): string;

  /**
   * 获取链接状态标�?
   */
  getValidStatusLabel(): string;

  /**
   * 获取链接状态颜�?
   */
  getValidStatusColor(): string;

  /**
   * 是否为内部链�?
   */
  isInternalLink(): boolean;

  /**
   * 是否为外部链�?
   */
  isExternalLink(): boolean;

  /**
   * 是否有锚�?
   */
  hasAnchor(): boolean;

  /**
   * 获取源位置文本（�?"Line 10, Col 5"�?
   */
  getSourceLocationText(): string | null;

  /**
   * 获取格式化的最后验证时�?
   */
  getFormattedLastValidated(): string | null;

  /**
   * 获取完整的目�?URL（包含锚点）
   */
  getFullTargetUrl(): string;

  // ===== DTO 转换方法 =====
}
