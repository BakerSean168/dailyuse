/**
 * SearchEngine Entity - Server Interface
 * 搜索引擎实体 - 服务端接�?
 */

import type { SearchEngineId, EditorWorkspaceId, IdentityId, TransferDate, DomainDate, PersistenceDate } from '../../../primitives';
import type { SearchEngineClientDTO } from './search-engine-client';

/**
 * Search Engine Server DTO
 * 搜索引擎服务�?DTO
 */
export interface SearchEngineServerDTO {
  id: SearchEngineId;
  workspaceId: EditorWorkspaceId; // 所属工作区 ID（聚合根外键�?
  identityId: IdentityId;
  name: string;
  description: string | null;
  indexPath: string; // 索引存储路径
  indexedDocumentCount: number; // 已索引文档数�?
  totalDocumentCount: number; // 总文档数�?
  lastIndexedAt: TransferDate | null;
  isIndexing: boolean; // 是否正在索引
  indexProgress: number | null; // 索引进度�?-100�?
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * Search Engine Persistence DTO
 * 搜索引擎持久�?DTO（数据库字段，snake_case�?
 */
export interface SearchEnginePersistenceDTO {
  id: SearchEngineId;
  workspace_id: EditorWorkspaceId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  index_path: string;
  indexed_document_count: number;
  total_document_count: number;
  last_indexed_at: PersistenceDate | null;
  is_indexing: boolean;
  index_progress: number | null;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}
