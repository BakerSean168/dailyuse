/**
 * IResourceVersionRepository
 * ResourceVersion entity repository
 */

import type { ResourceVersion } from '../entities/resource-version';
import type { VersionChangeType } from '@dailyuse/contracts/editor';

/**
 * ResourceVersion repository interface
 */
export interface IResourceVersionRepository {
  /**
   * 鏍规嵁 UUID 鏌ユ壘鐗堟湰
   */
  findById(id: string): Promise<ResourceVersion | null>;

  /**
   * 鏍规嵁鏂囨。 UUID 鏌ユ壘鎵€鏈夌増鏈?
   */
  findByResourceId(resourceId: string): Promise<ResourceVersion[]>;

  /**
   * 鏍规嵁鏂囨。 UUID 鏌ユ壘鏈€鏂扮増鏈?
   */
  findLatestByResourceId(resourceId: string): Promise<ResourceVersion | null>;

  /**
   * 鏍规嵁鏂囨。 UUID 鍜岀増鏈彿鏌ユ壘鐗堟湰
   */
  findByResourceIdAndVersionNumber(
    resourceId: string,
    versionNumber: number,
  ): Promise<ResourceVersion | null>;

  /**
   * 鏍规嵁鍙樻洿绫诲瀷鏌ユ壘鐗堟湰
   */
  findByChangeType(resourceId: string, changeType: VersionChangeType): Promise<ResourceVersion[]>;

  /**
   * 鏌ユ壘鎸囧畾鏃堕棿鑼冨洿鍐呯殑鐗堟湰
   */
  findByTimeRange(
    resourceId: string,
    startTime: number,
    endTime: number,
  ): Promise<ResourceVersion[]>;

  /**
   * 淇濆瓨鐗堟湰
   */
  save(version: ResourceVersion): Promise<void>;

  /**
   * 鍒犻櫎鐗堟湰
   */
  delete(id: string): Promise<void>;

  /**
   * 鎵归噺淇濆瓨鐗堟湰
   */
  saveBatch(versions: ResourceVersion[]): Promise<void>;

  /**
   * 鍒犻櫎鏂囨。鐨勬墍鏈夌増鏈?
   */
  deleteByResourceId(resourceId: string): Promise<void>;

  /**
   * 缁熻鏂囨。鐨勭増鏈暟閲?
   */
  countByResourceId(resourceId: string): Promise<number>;

  /**
   * 鑾峰彇鏂囨。鐨勬渶鏂扮増鏈彿
   */
  getLatestVersionNumber(resourceId: string): Promise<number>;
}
