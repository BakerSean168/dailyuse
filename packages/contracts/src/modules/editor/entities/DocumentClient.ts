/**
 * Document Entity - Client Interface
 * 文档实体 - 客户端接口
 */

import type { DocumentLanguage, IndexStatus } from '../enums';
import type { DocumentServerDTO } from './DocumentServer';

// 从值对象导入类型
import type { DocumentMetadataClientDTO } from '../value-objects';

/**
 * Document Client DTO
 * 文档客户端 DTO（包含 UI 格式化字段）
 */
export interface DocumentClientDTO {
  uuid: string;
  workspaceUuid: string;
  accountUuid: string;
  path: string;
  name: string;
  language: DocumentLanguage;
  content: string;
  contentHash: string;
  metadata: DocumentMetadataClientDTO;
  indexStatus: IndexStatus;
  lastIndexedAt?: number | null;
  lastModifiedAt?: number | null;
  createdAt: number;
  updatedAt: number;

  // UI 格式化字段
  formattedLastIndexed?: string | null;
  formattedLastModified?: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

/**
 * Document Entity - Client Interface
 * 文档实体 - 客户端接口
 */
export interface DocumentClient {
  // ===== 基础属性 =====
  readonly uuid: string;
  readonly workspaceUuid: string;
  readonly accountUuid: string;
  readonly path: string;
  readonly name: string;
  readonly language: DocumentLanguage;
  readonly content: string;
  readonly contentHash: string;
  readonly metadata: DocumentMetadataClientDTO;
  readonly indexStatus: IndexStatus;
  readonly lastIndexedAt?: number | null;
  readonly lastModifiedAt?: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // ===== UI 辅助方法 =====

  /**
   * 获取文件扩展名
   */
  getFileExtension(): string;

  /**
   * 获取语言标签
   */
  getLanguageLabel(): string;

  /**
   * 获取索引状态颜色
   */
  getIndexStatusColor(): string;

  /**
   * 获取索引状态标签
   */
  getIndexStatusLabel(): string;

  /**
   * 是否为 Markdown 文档
   */
  isMarkdown(): boolean;

  /**
   * 是否需要重新索引
   */
  needsReindex(): boolean;

  /**
   * 获取格式化的最后索引时间
   */
  getFormattedLastIndexed(): string | null;

  /**
   * 获取格式化的最后修改时间
   */
  getFormattedLastModified(): string | null;

  /**
   * 获取内容预览（前 N 个字符）
   */
  getContentPreview(maxLength?: number): string;

  /**
   * 获取文件大小（字节数）
   */
  getContentSize(): number;

  // ===== DTO 转换方法 =====}
