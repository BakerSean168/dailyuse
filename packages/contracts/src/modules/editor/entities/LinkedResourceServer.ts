/**
 * LinkedResource Entity - Server Interface
 * 链接资源实体 - 服务端接口
 */

import type { LinkedSourceType, LinkedTargetType } from '../enums';
import type { LinkedResourceClientDTO } from './LinkedResourceClient';

/**
 * Linked Resource Server DTO
 * 链接资源服务端 DTO
 */
export interface LinkedResourceServerDTO {
  uuid: string;
  workspaceUuid: string; // 所属工作区 UUID（聚合根外键）
  accountUuid: string;
  sourceDocumentUuid: string; // 源文档 UUID
  sourceType: LinkedSourceType;
  sourceLine?: number | null; // 源位置（行号）
  sourceColumn?: number | null; // 源位置（列号）
  targetPath: string; // 目标路径（可能是相对路径或绝对路径）
  targetType: LinkedTargetType;
  targetDocumentUuid?: string | null; // 目标文档 UUID（如果是内部文档）
  targetAnchor?: string | null; // 目标锚点（如 #heading-id）
  isValid: boolean; // 链接是否有效（目标是否存在）
  lastValidatedAt?: number | null; // epoch ms
  createdAt: number;
  updatedAt: number;
}

/**
 * Linked Resource Persistence DTO
 * 链接资源持久化 DTO（数据库字段，snake_case）
 */
export interface LinkedResourcePersistenceDTO {
  uuid: string;
  workspace_uuid: string;
  accountUuid: string;
  source_document_uuid: string;
  source_type: LinkedSourceType;
  source_line?: number | null;
  source_column?: number | null;
  target_path: string;
  target_type: LinkedTargetType;
  target_document_uuid?: string | null;
  target_anchor?: string | null;
  is_valid: boolean;
  last_validated_at?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Linked Resource Entity - Server Interface
 * 链接资源实体 - 服务端接口
 */
export interface LinkedResourceServer {
  // ===== 基础属性 =====
  readonly uuid: string;
  readonly workspaceUuid: string;
  readonly accountUuid: string;
  readonly sourceDocumentUuid: string;
  readonly sourceType: LinkedSourceType;
  readonly sourceLine?: number | null;
  readonly sourceColumn?: number | null;
  readonly targetPath: string;
  readonly targetType: LinkedTargetType;
  readonly targetDocumentUuid?: string | null;
  readonly targetAnchor?: string | null;
  readonly isValid: boolean;
  readonly lastValidatedAt?: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // ===== 业务方法 =====

  /**
   * 标记为有效
   */
  markValid(): void;

  /**
   * 标记为无效（链接失效）
   */
  markInvalid(): void;

  /**
   * 更新目标路径（当文件移动时）
   */
  updateTargetPath(newPath: string): void;

  /**
   * 更新目标文档 UUID（当链接目标是内部文档时）
   */
  updateTargetDocument(documentUuid: string | null): void;

  /**
   * 更新源位置（当源文档编辑时）
   */
  updateSourceLocation(line: number | null, column: number | null): void;

  /**
   * 记录验证时间
   */
  recordValidation(): void;

  /**
   * 判断是否为内部链接（指向工作区内文档）
   */
  isInternalLink(): boolean;

  /**
   * 判断是否为外部链接
   */
  isExternalLink(): boolean;

  /**
   * 判断是否有锚点
   */
  hasAnchor(): boolean;

  // ===== DTO 转换方法 =====

  toServerDTO(): LinkedResourceServerDTO;
  toClientDTO(): LinkedResourceClientDTO;
  toPersistenceDTO(): LinkedResourcePersistenceDTO;
}
