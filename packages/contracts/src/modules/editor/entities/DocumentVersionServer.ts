/**
 * DocumentVersion Entity - Server Interface
 * 文档版本实体 - 服务端接口
 */

import type { VersionChangeType } from '../enums';
import type { DocumentVersionClientDTO } from './DocumentVersionClient';

/**
 * Document Version Server DTO
 * 文档版本服务端 DTO
 */
export interface DocumentVersionServerDTO {
  uuid: string;
  documentUuid: string; // 所属文档 UUID
  workspaceUuid: string; // 所属工作区 UUID（聚合根外键）
  accountUuid: string;
  versionNumber: number; // 版本号（递增）
  changeType: VersionChangeType;
  contentHash: string; // 内容哈希值
  contentDiff?: string | null; // 内容差异（diff 格式）
  changeDescription?: string | null; // 变更描述
  previousVersionUuid?: string | null; // 上一个版本 UUID
  createdBy?: string | null; // 创建者
  createdAt: number;
}

/**
 * Document Version Persistence DTO
 * 文档版本持久化 DTO（数据库字段，snake_case）
 */
export interface DocumentVersionPersistenceDTO {
  uuid: string;
  document_uuid: string;
  workspace_uuid: string;
  accountUuid: string;
  version_number: number;
  change_type: VersionChangeType;
  content_hash: string;
  content_diff?: string | null;
  change_description?: string | null;
  previous_version_uuid?: string | null;
  created_by?: string | null;
  createdAt: Date;
}

/**
 * Document Version Entity - Server Interface
 * 文档版本实体 - 服务端接口
 */
export interface DocumentVersionServer {
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

  // ===== 业务方法 =====

  /**
   * 更新变更描述
   */
  updateDescription(description: string): void;

  /**
   * 判断是否为首个版本
   */
  isFirstVersion(): boolean;

  /**
   * 判断变更类型是否为编辑
   */
  isEditChange(): boolean;

  /**
   * 判断变更类型是否为创建
   */
  isCreateChange(): boolean;

  // ===== DTO 转换方法 =====

  toServerDTO(): DocumentVersionServerDTO;
  toClientDTO(): DocumentVersionClientDTO;
  toPersistenceDTO(): DocumentVersionPersistenceDTO;
}
