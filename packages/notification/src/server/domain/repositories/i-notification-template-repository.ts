/**
 * NotificationTemplate 浠撳偍鎺ュ彛
 *
 * DDD 浠撳偍妯″紡锛?
 * - 鍙畾涔夋帴鍙ｏ紝涓嶅疄鐜?
 * - 鐢卞熀纭€璁炬柦灞傚疄鐜?
 */

import type { NotificationTemplate } from '../aggregates/notification-template';
import { NotificationCategory, NotificationType } from '@memoflow/contracts/notification';

/**
 * INotificationTemplateRepository 浠撳偍鎺ュ彛
 *
 * 鑱岃矗锛?
 * - 绠＄悊閫氱煡妯℃澘鐨勬寔涔呭寲
 * - 鏀寔妯℃澘鏌ヨ鍜岀瓫閫?
 */
export interface INotificationTemplateRepository {
  /**
   * 淇濆瓨妯℃澘锛堝垱寤烘垨鏇存柊锛?
   */
  save(template: NotificationTemplate): Promise<void>;

  /**
   * 閫氳繃 UUID 鏌ユ壘妯℃澘
   */
  findById(id: string): Promise<NotificationTemplate | null>;

  /**
   * 鏌ユ壘鎵€鏈夋ā鏉?
   *
   * @param options.includeInactive 鏄惁鍖呭惈鏈縺娲荤殑妯℃澘锛堥粯璁?false锛?
   */
  findAll(options?: { includeInactive?: boolean }): Promise<NotificationTemplate[]>;

  /**
   * 閫氳繃鍚嶇О鏌ユ壘妯℃澘
   */
  findByName(name: string): Promise<NotificationTemplate | null>;

  /**
   * 閫氳繃鍒嗙被鏌ユ壘妯℃澘
   *
   * @param category 閫氱煡鍒嗙被
   * @param options.activeOnly 鍙繑鍥炴縺娲荤殑妯℃澘锛堥粯璁?true锛?
   */
  findByCategory(
    category: NotificationCategory,
    options?: { activeOnly?: boolean },
  ): Promise<NotificationTemplate[]>;

  /**
   * 閫氳繃绫诲瀷鏌ユ壘妯℃澘
   *
   * @param type 閫氱煡绫诲瀷
   * @param options.activeOnly 鍙繑鍥炴縺娲荤殑妯℃澘锛堥粯璁?true锛?
   */
  findByType(
    type: NotificationType,
    options?: { activeOnly?: boolean },
  ): Promise<NotificationTemplate[]>;

  /**
   * 鏌ユ壘绯荤粺棰勮妯℃澘
   */
  findSystemTemplates(): Promise<NotificationTemplate[]>;

  /**
   * 鍒犻櫎妯℃澘
   */
  delete(id: string): Promise<void>;

  /**
   * 妫€鏌ユā鏉挎槸鍚﹀瓨鍦?
   */
  exists(id: string): Promise<boolean>;

  /**
   * 妫€鏌ユā鏉垮悕绉版槸鍚﹀凡琚娇鐢?
   *
   * @param name 妯℃澘鍚嶇О
   * @param excludeId 鎺掗櫎鐨?UUID锛堢敤浜庢洿鏂版椂妫€鏌ワ級
   */
  isNameUsed(name: string, excludeId?: string): Promise<boolean>;

  /**
   * 缁熻妯℃澘鏁伴噺
   */
  count(options?: { activeOnly?: boolean }): Promise<number>;
}
