/**
 * IDocumentVersionRepository
 * DocumentVersion 瀹炰綋浠撳偍鎺ュ彛
 */

import type { DocumentVersion } from '../entities/document-version';
import type { VersionChangeType } from '@dailyuse/contracts/editor';

/**
 * DocumentVersion 浠撳偍鎺ュ彛
 */
export interface IDocumentVersionRepository {
  /**
   * 鏍规嵁 UUID 鏌ユ壘鐗堟湰
   */
  findById(id: string): Promise<DocumentVersion | null>;

  /**
   * 鏍规嵁鏂囨。 UUID 鏌ユ壘鎵€鏈夌増鏈?
   */
  findByDocumentId(documentId: string): Promise<DocumentVersion[]>;

  /**
   * 鏍规嵁鏂囨。 UUID 鏌ユ壘鏈€鏂扮増鏈?
   */
  findLatestByDocumentId(documentId: string): Promise<DocumentVersion | null>;

  /**
   * 鏍规嵁鏂囨。 UUID 鍜岀増鏈彿鏌ユ壘鐗堟湰
   */
  findByDocumentIdAndVersionNumber(
    documentId: string,
    versionNumber: number,
  ): Promise<DocumentVersion | null>;

  /**
   * 鏍规嵁鍙樻洿绫诲瀷鏌ユ壘鐗堟湰
   */
  findByChangeType(documentId: string, changeType: VersionChangeType): Promise<DocumentVersion[]>;

  /**
   * 鏌ユ壘鎸囧畾鏃堕棿鑼冨洿鍐呯殑鐗堟湰
   */
  findByTimeRange(
    documentId: string,
    startTime: number,
    endTime: number,
  ): Promise<DocumentVersion[]>;

  /**
   * 淇濆瓨鐗堟湰
   */
  save(version: DocumentVersion): Promise<void>;

  /**
   * 鍒犻櫎鐗堟湰
   */
  delete(id: string): Promise<void>;

  /**
   * 鎵归噺淇濆瓨鐗堟湰
   */
  saveBatch(versions: DocumentVersion[]): Promise<void>;

  /**
   * 鍒犻櫎鏂囨。鐨勬墍鏈夌増鏈?
   */
  deleteByDocumentId(documentId: string): Promise<void>;

  /**
   * 缁熻鏂囨。鐨勭増鏈暟閲?
   */
  countByDocumentId(documentId: string): Promise<number>;

  /**
   * 鑾峰彇鏂囨。鐨勬渶鏂扮増鏈彿
   */
  getLatestVersionNumber(documentId: string): Promise<number>;
}
