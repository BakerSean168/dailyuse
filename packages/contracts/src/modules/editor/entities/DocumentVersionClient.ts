/**
 * DocumentVersion Entity - Client Interface
 * 文档版本实体 - 客户端接口
 */

import type { VersionChangeType } from '../enums';
import type { DocumentVersionServerDTO } from './DocumentVersionServer';

/**
 * Document Version Client DTO
 * 文档版本客户端 DTO（包含 UI 格式化字段）
 */
export interface DocumentVersionClientDTO {
  uuid: string;
  documentUuid: string;
  workspaceUuid: string;
  accountUuid: string;
  versionNumber: number;
  changeType: VersionChangeType;
  contentHash: string;
  contentDiff?: string | null;
  changeDescription?: string | null;
  previousVersionUuid?: string | null;
  createdBy?: string | null;
  createdAt: number;

  // UI 格式化字段
  formattedCreatedAt: string;
}

/**
 * Document Version Entity - Client Interface
 * 文档版本实体 - 客户端接口
 */
export interface DocumentVersionClient {
  // ===== 基础属性 =====
  readonly uuid: string;
  readonly documentUuid: string;
  readonly workspaceUuid: string;
  readonly accountUuid: string;
  readonly versionNumber: number;
  readonly changeType: VersionChangeType;
  readonly contentHash: string;
  readonly contentDiff?: string | null;
  readonly changeDescription?: string | null;
  readonly previousVersionUuid?: string | null;
  readonly createdBy?: string | null;
  readonly createdAt: Date;

  // ===== UI 辅助方法 =====

  /**
   * 获取变更类型标签
   */
  getChangeTypeLabel(): string;

  /**
   * 获取变更类型颜色
   */
  getChangeTypeColor(): string;

  /**
   * 获取版本显示名称（如 "v1", "v2"）
   */
  getVersionLabel(): string;

  /**
   * 是否为首个版本
   */
  isFirstVersion(): boolean;

  /**
   * 是否有变更描述
   */
  hasDescription(): boolean;

  /**
   * 获取创建者显示名称（如果没有则返回默认值）
   */
  getCreatorDisplayName(): string;

  // ===== DTO 转换方法 =====

  toClientDTO(): DocumentVersionClientDTO;
  toServerDTO(): DocumentVersionServerDTO;
}
