/**
 * NotificationPreference 浠撳偍鎺ュ彛
 *
 * DDD 浠撳偍妯″紡锛?
 * - 鍙畾涔夋帴鍙ｏ紝涓嶅疄鐜?
 * - 鐢卞熀纭€璁炬柦灞傚疄鐜?
 */

import type { NotificationPreference } from '../aggregates/notification-preference';

/**
 * INotificationPreferenceRepository 浠撳偍鎺ュ彛
 *
 * 鑱岃矗锛?
 * - 绠＄悊鐢ㄦ埛閫氱煡鍋忓ソ鐨勬寔涔呭寲
 * - 姣忎釜璐︽埛鍙湁涓€涓亸濂借缃?
 */
export interface INotificationPreferenceRepository {
  /**
   * 淇濆瓨鍋忓ソ璁剧疆锛堝垱寤烘垨鏇存柊锛?
   */
  save(preference: NotificationPreference): Promise<void>;

  /**
   * 閫氳繃 UUID 鏌ユ壘鍋忓ソ璁剧疆
   */
  findById(id: string): Promise<NotificationPreference | null>;

  /**
   * 閫氳繃璐︽埛 UUID 鏌ユ壘鍋忓ソ璁剧疆
   *
   * @param identityId 璐︽埛 UUID
   * @returns 鍋忓ソ璁剧疆锛屼笉瀛樺湪鍒欒繑鍥?null
   */
  findByIdentityId(identityId: string): Promise<NotificationPreference | null>;

  /**
   * 鍒犻櫎鍋忓ソ璁剧疆
   */
  delete(id: string): Promise<void>;

  /**
   * 妫€鏌ュ亸濂借缃槸鍚﹀瓨鍦?
   */
  exists(id: string): Promise<boolean>;

  /**
   * 妫€鏌ヨ处鎴锋槸鍚﹀凡鏈夊亸濂借缃?
   *
   * @param identityId 璐︽埛 UUID
   */
  existsForIdentity(identityId: string): Promise<boolean>;

  /**
   * 鑾峰彇鎴栧垱寤哄亸濂借缃?
   *
   * @param identityId 璐︽埛 UUID
   * @returns 鍋忓ソ璁剧疆锛堝鏋滀笉瀛樺湪鍒欏垱寤洪粯璁よ缃級
   */
  getOrCreate(identityId: string): Promise<NotificationPreference>;
}
