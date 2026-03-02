/**
 * Document Entity - Server Interface
 * 文档实体 - 服务端接�?
 */

import type { DocumentId, EditorWorkspaceId, IdentityId, TransferDate, DomainDate, PersistenceDate } from '../../../primitives';
import type { DocumentLanguage } from '../value-objects/document-language';
import type { IndexStatus } from '../value-objects/index-status';
import type { DocumentClientDTO } from './document-client';

// 从值对象导入类�?
import type { DocumentMetadataServerDTO } from '../value-objects';

/**
 * Document Server DTO
 * 文档服务�?DTO
 */
export interface DocumentServerDTO {
  id: DocumentId;
  workspaceId: EditorWorkspaceId; // 所属工作区 ID（聚合根外键�?
  identityId: IdentityId;
  path: string; // 文档路径（相对于工作区根目录�?
  name: string; // 文档名称（包含扩展名�?
  language: DocumentLanguage;
  content: string;
  contentHash: string; // 内容哈希值（用于变更检测）
  metadata: DocumentMetadataServerDTO;
  indexStatus: IndexStatus;
  lastIndexedAt: TransferDate | null;
  lastModifiedAt: TransferDate | null; // 文件系统修改时间
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * Document Persistence DTO
 * 文档持久�?DTO（数据库字段，snake_case�?
 */
export interface DocumentPersistenceDTO {
  id: DocumentId;
  workspace_id: EditorWorkspaceId;
  identityId: IdentityId;
  path: string;
  name: string;
  language: DocumentLanguage;
  content: string;
  content_hash: string;
  metadata: string; // JSON 字符�?
  index_status: IndexStatus;
  last_indexed_at: PersistenceDate | null;
  last_modified_at: PersistenceDate | null;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}
