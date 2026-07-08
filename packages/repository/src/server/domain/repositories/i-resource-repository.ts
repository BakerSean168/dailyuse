/**
 * IResourceRepository - 璧勬簮浠撳偍鎺ュ彛
 *
 * 鑱岃矗锛?
 * - 璧勬簮鐨?CRUD 鎿嶄綔
 * - 璧勬簮鏌ヨ
 */

import type { Resource } from '../entities/resource';

export interface IResourceRepository {
  /**
   * 淇濆瓨璧勬簮
   */
  save(resource: Resource): Promise<void>;

  /**
   * 鏍规嵁 ID 鏌ユ壘璧勬簮
   */
  findById(id: string): Promise<Resource | null>;

  /**
   * 鏍规嵁浠撳簱 ID 鏌ユ壘璧勬簮
   */
  findByRepositoryId(repositoryId: string): Promise<Resource[]>;

  findByRepositoryIdAndPath(repositoryId: string, path: string): Promise<Resource | null>;

  /**
   * 鏍规嵁鏂囦欢澶?UUID 鏌ユ壘璧勬簮
   */
  findByFolderId(folderId: string): Promise<Resource[]>;

  /**
   * 鏍规嵁璐︽埛 UUID 鏌ユ壘璧勬簮
   */
  findByIdentityId(identityId: string): Promise<Resource[]>;

  /**
   * 妫€鏌ヨ矾寰勬槸鍚﹀凡瀛樺湪璧勬簮
   */
  existsByPath(repositoryId: string, path: string): Promise<boolean>;

  /**
   * 鍒犻櫎璧勬簮
   */
  delete(id: string): Promise<void>;
}
