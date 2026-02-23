/**
 * SearchEngine Entity - Client Interface
 * 搜索引擎实体 - 客户端接�?
 */

import type { SearchEngineId, EditorWorkspaceId, IdentityId, TransferDate, DomainDate } from '@/primitives';
import type { SearchEngineServerDTO } from './search-engine-server';

/**
 * Search Engine Client DTO
 * 搜索引擎客户�?DTO（包�?UI 格式化字段）
 */
export interface SearchEngineClientDTO {
  id: string;
  workspaceId: string;
  identityId: string;
  name: string;
  description: string | null;
  indexPath: string;
  indexedDocumentCount: number;
  totalDocumentCount: number;
  lastIndexedAt: TransferDate | null;
  isIndexing: boolean;
  indexProgress: number | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;

  // UI 格式化字�?
  formattedLastIndexed: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}
