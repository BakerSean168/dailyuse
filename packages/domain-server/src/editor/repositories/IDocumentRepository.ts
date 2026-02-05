/**
 * IDocumentRepository
 * Document 实体仓储接口
 */

import type { Document } from '../entities/document';
import type { IndexStatus } from '@dailyuse/contracts/editor';

/**
 * Document 仓储接口
 */
export interface IDocumentRepository {
  /**
   * 根据 UUID 查找文档
   */
  findByUuid(uuid: string): Promise<Document | null>;

  /**
   * 根据工作区 UUID 查找所有文档
   */
  findByWorkspaceUuid(workspaceUuid: string): Promise<Document[]>;

  /**
   * 根据路径查找文档
   */
  findByPath(workspaceUuid: string, path: string): Promise<Document | null>;

  /**
   * 根据内容哈希查找文档
   */
  findByContentHash(contentHash: string): Promise<Document[]>;

  /**
   * 查找需要索引的文档（索引状态为 OUTDATED 或 FAILED）
   */
  findDocumentsNeedingIndex(workspaceUuid: string): Promise<Document[]>;

  /**
   * 根据索引状态查找文档
   */
  findByIndexStatus(workspaceUuid: string, status: IndexStatus): Promise<Document[]>;

  /**
   * 查找最近修改的文档
   */
  findRecentlyModified(workspaceUuid: string, limit: number): Promise<Document[]>;

  /**
   * 保存文档
   */
  save(document: Document): Promise<void>;

  /**
   * 删除文档
   */
  delete(uuid: string): Promise<void>;

  /**
   * 批量保存文档
   */
  saveBatch(documents: Document[]): Promise<void>;

  /**
   * 删除工作区的所有文档
   */
  deleteByWorkspaceUuid(workspaceUuid: string): Promise<void>;

  /**
   * 统计工作区的文档数量
   */
  countByWorkspaceUuid(workspaceUuid: string): Promise<number>;

  /**
   * 统计需要索引的文档数量
   */
  countDocumentsNeedingIndex(workspaceUuid: string): Promise<number>;
}
