/**
 * Document Entity - Client Interface
 * 文档实体 - 客户端接�?
 */

import type { DocumentId, EditorWorkspaceId, IdentityId, TransferDate, DomainDate } from '@/primitives';
import type { DocumentLanguage } from '../value-objects/document-language';
import type { IndexStatus } from '../value-objects/index-status';
import type { DocumentServerDTO } from './document-server';

// 从值对象导入类型
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
