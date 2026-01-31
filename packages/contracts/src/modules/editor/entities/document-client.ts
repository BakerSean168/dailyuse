/**
 * Document Entity - Client Interface
 * 文档实体 - 客户端接�?
 */

import type { DocumentId, EditorWorkspaceId, IdentityId, TransferDate, DomainDate } from '@/primitives';
import type { DocumentLanguage } from '../value-objects/document-language';
import type { IndexStatus } from '../value-objects/index-status';
import type { DocumentServerDTO } from './document-server';

// 从值对象导入类�?
import type { DocumentMetadataClientDTO } from '../value-objects';

/**
 * Document Client DTO
 * 文档客户�?DTO（包�?UI 格式化字段）
 */
export interface DocumentClientDTO {
  id: string;
  workspaceId: string;
  identityId: string;
  path: string;
  name: string;
  language: DocumentLanguage;
  content: string;
  contentHash: string;
  metadata: DocumentMetadataClientDTO;
  indexStatus: IndexStatus;
  lastIndexedAt: TransferDate | null;
  lastModifiedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;

  // UI 格式化字�?
  formattedLastIndexed: string | null;
  formattedLastModified: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

/**
 * Document Entity - Client Interface
 * 文档实体 - 客户端接�?
 */
export interface DocumentClient {
  // ===== 基础属�?=====
  readonly id: DocumentId;
  readonly workspaceId: EditorWorkspaceId;
  readonly identityId: IdentityId;
  readonly path: string;
  readonly name: string;
  readonly language: DocumentLanguage;
  readonly content: string;
  readonly contentHash: string;
  readonly metadata: DocumentMetadataClientDTO;
  readonly indexStatus: IndexStatus;
  readonly lastIndexedAt: DomainDate | null;
  readonly lastModifiedAt: DomainDate | null;
  readonly createdAt: DomainDate;
  readonly updatedAt: DomainDate;

  // ===== UI 辅助方法 =====

  /**
   * 获取文件扩展�?
   */

  /**
   * 获取语言标签
   */

  /**
   * 获取索引状态颜�?
   */

  /**
   * 获取索引状态标�?
   */

  /**
   * 是否�?Markdown 文档
   */

  /**
   * 是否需要重新索�?
   */

  /**
   * 获取格式化的最后索引时�?
   */

  /**
   * 获取格式化的最后修改时�?
   */

  /**
   * 获取内容预览（前 N 个字符）
   */

  /**
   * 获取文件大小（字节数�?
   */

}
