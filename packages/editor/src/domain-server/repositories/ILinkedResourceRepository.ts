/**
 * ILinkedResourceRepository
 * LinkedResource 瀹炰綋浠撳偍鎺ュ彛
 */

import type { LinkedResource } from '../entities/linked-resource';
import type { LinkedSourceType, LinkedTargetType } from '@dailyuse/contracts/editor';

/**
 * LinkedResource 浠撳偍鎺ュ彛
 */
export interface ILinkedResourceRepository {
  /**
   * 鏍规嵁 UUID 鏌ユ壘閾炬帴璧勬簮
   */
  findById(id: string): Promise<LinkedResource | null>;

  /**
   * 鏍规嵁婧愭枃妗?UUID 鏌ユ壘鎵€鏈夐摼鎺ヨ祫婧?
   */
  findBySourceDocumentId(sourceDocumentId: string): Promise<LinkedResource[]>;

  /**
   * 鏍规嵁鐩爣鏂囨。 UUID 鏌ユ壘鎵€鏈夐摼鎺ヨ祫婧愶紙鍙嶅悜鏌ユ壘锛?
   */
  findByTargetDocumentId(targetDocumentId: string): Promise<LinkedResource[]>;

  /**
   * 鏍规嵁婧愮被鍨嬫煡鎵鹃摼鎺ヨ祫婧?
   */
  findBySourceType(
    sourceDocumentId: string,
    sourceType: LinkedSourceType,
  ): Promise<LinkedResource[]>;

  /**
   * 鏍规嵁鐩爣绫诲瀷鏌ユ壘閾炬帴璧勬簮
   */
  findByTargetType(
    sourceDocumentId: string,
    targetType: LinkedTargetType,
  ): Promise<LinkedResource[]>;

  /**
   * 鏌ユ壘鏃犳晥鐨勯摼鎺ヨ祫婧?
   */
  findInvalid(workspaceId: string): Promise<LinkedResource[]>;

  /**
   * 鏌ユ壘闇€瑕侀獙璇佺殑閾炬帴璧勬簮锛堣秴杩囨寚瀹氶槇鍊兼湭楠岃瘉锛?
   */
  findNeedingValidation(threshold: number): Promise<LinkedResource[]>;

  /**
   * 淇濆瓨閾炬帴璧勬簮
   */
  save(resource: LinkedResource): Promise<void>;

  /**
   * 鍒犻櫎閾炬帴璧勬簮
   */
  delete(id: string): Promise<void>;

  /**
   * 鎵归噺淇濆瓨閾炬帴璧勬簮
   */
  saveBatch(resources: LinkedResource[]): Promise<void>;

  /**
   * 鍒犻櫎婧愭枃妗ｇ殑鎵€鏈夐摼鎺ヨ祫婧?
   */
  deleteBySourceDocumentId(sourceDocumentId: string): Promise<void>;

  /**
   * 鍒犻櫎鐩爣鏂囨。鐨勬墍鏈夐摼鎺ヨ祫婧愶紙褰撴枃妗ｈ鍒犻櫎鏃讹級
   */
  deleteByTargetDocumentId(targetDocumentId: string): Promise<void>;

  /**
   * 缁熻婧愭枃妗ｇ殑閾炬帴璧勬簮鏁伴噺
   */
  countBySourceDocumentId(sourceDocumentId: string): Promise<number>;

  /**
   * 缁熻鏃犳晥閾炬帴鏁伴噺
   */
  countInvalid(workspaceId: string): Promise<number>;
}
