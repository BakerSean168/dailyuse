/**
 * IDocumentVersionRepository
 * DocumentVersion 实体仓储接口
 */

import type { DocumentVersion } from '../entities/document-version';
import type { VersionChangeType } from '@dailyuse/contracts/editor';

/**
 * DocumentVersion 仓储接口
 */
export interface IDocumentVersionRepository {
  /**
   * 根据 UUID 查找版本
   */
  findByUuid(uuid: string): Promise<DocumentVersion | null>;

  /**
   * 根据文档 UUID 查找所有版本
   */
  findByDocumentUuid(documentUuid: string): Promise<DocumentVersion[]>;

  /**
   * 根据文档 UUID 查找最新版本
   */
  findLatestByDocumentUuid(documentUuid: string): Promise<DocumentVersion | null>;

  /**
   * 根据文档 UUID 和版本号查找版本
   */
  findByDocumentUuidAndVersionNumber(
    documentUuid: string,
    versionNumber: number,
  ): Promise<DocumentVersion | null>;

  /**
   * 根据变更类型查找版本
   */
  findByChangeType(documentUuid: string, changeType: VersionChangeType): Promise<DocumentVersion[]>;

  /**
   * 查找指定时间范围内的版本
   */
  findByTimeRange(
    documentUuid: string,
    startTime: number,
    endTime: number,
  ): Promise<DocumentVersion[]>;

  /**
   * 保存版本
   */
  save(version: DocumentVersion): Promise<void>;

  /**
   * 删除版本
   */
  delete(uuid: string): Promise<void>;

  /**
   * 批量保存版本
   */
  saveBatch(versions: DocumentVersion[]): Promise<void>;

  /**
   * 删除文档的所有版本
   */
  deleteByDocumentUuid(documentUuid: string): Promise<void>;

  /**
   * 统计文档的版本数量
   */
  countByDocumentUuid(documentUuid: string): Promise<number>;

  /**
   * 获取文档的最新版本号
   */
  getLatestVersionNumber(documentUuid: string): Promise<number>;
}
