/**
 * Document Entity - Server Interface
 * 文档实体 - 服务端接口
 */

import type { DocumentLanguage, IndexStatus } from '../enums';
import type { DocumentClientDTO } from './DocumentClient';

// 从值对象导入类型
import type { DocumentMetadataServerDTO } from '../value-objects';

/**
 * Document Server DTO
 * 文档服务端 DTO
 */
export interface DocumentServerDTO {
  uuid: string;
  workspaceUuid: string; // 所属工作区 UUID（聚合根外键）
  accountUuid: string;
  path: string; // 文档路径（相对于工作区根目录）
  name: string; // 文档名称（包含扩展名）
  language: DocumentLanguage;
  content: string;
  contentHash: string; // 内容哈希值（用于变更检测）
  metadata: DocumentMetadataServerDTO;
  indexStatus: IndexStatus;
  lastIndexedAt?: number | null; // epoch ms
  lastModifiedAt?: number | null; // epoch ms（文件系统修改时间）
  createdAt: number;
  updatedAt: number;
}

/**
 * Document Persistence DTO
 * 文档持久化 DTO（数据库字段，snake_case）
 */
export interface DocumentPersistenceDTO {
  uuid: string;
  workspace_uuid: string;
  accountUuid: string;
  path: string;
  name: string;
  language: DocumentLanguage;
  content: string;
  content_hash: string;
  metadata: string; // JSON 字符串
  index_status: IndexStatus;
  last_indexed_at?: Date | null;
  last_modified_at?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Document Entity - Server Interface
 * 文档实体 - 服务端接口
 */
export interface DocumentServer {
  // ===== 基础属性 =====
  readonly uuid: string;
  readonly workspaceUuid: string;
  readonly accountUuid: string;
  readonly path: string;
  readonly name: string;
  readonly language: DocumentLanguage;
  readonly content: string;
  readonly contentHash: string;
  readonly metadata: DocumentMetadataServerDTO;
  readonly indexStatus: IndexStatus;
  readonly lastIndexedAt?: number | null;
  readonly lastModifiedAt?: number | null;
  readonly createdAt: number;
  readonly updatedAt: number;

  // ===== 业务方法 =====

  /**
   * 更新文档内容
   */
  updateContent(content: string, contentHash: string): void;

  /**
   * 更新元数据
   */
  updateMetadata(metadata: Partial<DocumentMetadataServerDTO>): void;

  /**
   * 重命名文档
   */
  rename(newName: string): void;

  /**
   * 移动文档到新路径
   */
  move(newPath: string): void;

  /**
   * 标记为已索引
   */
  markIndexed(): void;

  /**
   * 标记索引过期
   */
  markIndexOutdated(): void;

  /**
   * 标记索引失败
   */
  markIndexFailed(): void;

  /**
   * 更新文件修改时间
   */
  updateFileModifiedTime(timestamp: number): void;

  /**
   * 获取文件扩展名
   */
  getFileExtension(): string;

  /**
   * 判断是否为 Markdown 文档
   */
  isMarkdown(): boolean;

  // ===== DTO 转换方法 =====

  toServerDTO(): DocumentServerDTO;
  toClientDTO(): DocumentClientDTO;
  toPersistenceDTO(): DocumentPersistenceDTO;
}
