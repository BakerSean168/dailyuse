/**
 * Setting Repository Interface
 * 璁剧疆浠撳偍鎺ュ彛
 *
 * DDD 浠撳偍妯″紡锛?
 * - 鍙畾涔夋帴鍙ｏ紝涓嶅疄鐜?
 * - 鐢卞熀纭€璁炬柦灞傚疄鐜?
 * - 浣跨敤渚濊禆娉ㄥ叆
 * - 闅愯棌鏁版嵁璁块棶缁嗚妭
 */

import type { Setting } from '../aggregates/setting';
import { SettingScope } from '@dailyuse/contracts/setting';

export interface SettingQueryOptions {
  category?: string;
  isDefault?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * ISettingRepository 浠撳偍鎺ュ彛
 *
 * 鑱岃矗锛?
 * - 瀹氫箟 Setting 鑱氬悎鏍圭殑鎸佷箙鍖栨搷浣?
 * - 鑱氬悎鏍规槸鎿嶄綔鐨勫熀鏈崟浣?
 * - 绾ц仈淇濆瓨/鍔犺浇瀛愬疄浣擄紙濡?history锛?
 */
export interface ISettingRepository {
  /**
   * 淇濆瓨鑱氬悎鏍癸紙鍒涘缓鎴栨洿鏂帮級
   *
   * 娉ㄦ剰锛?
   * - 杩欐槸浜嬪姟鎿嶄綔
   * - 绾ц仈淇濆瓨鍘嗗彶璁板綍
   * - 濡傛灉 UUID 宸插瓨鍦ㄥ垯鏇存柊锛屽惁鍒欐彃鍏?
   */
  save(setting: Setting): Promise<void>;

  /**
   * 閫氳繃 UUID 鏌ユ壘鑱氬悎鏍?
   *
   * @param id 璁剧疆 UUID
   * @param options.includeHistory 鏄惁鍔犺浇鍘嗗彶璁板綍锛堥粯璁?false锛屾噿鍔犺浇锛?
   * @returns 鑱氬悎鏍瑰疄渚嬶紝涓嶅瓨鍦ㄥ垯杩斿洖 null
   */
  findById(id: string, options?: { includeHistory?: boolean }): Promise<Setting | null>;

  /**
   * 閫氳繃 key 鏌ユ壘璁剧疆
   *
   * @param key 璁剧疆閿?
   * @param scope 浣滅敤鍩?
   * @param contextId 涓婁笅鏂?ID锛坕dentityId 鎴?deviceId锛?
   * @returns 鑱氬悎鏍瑰疄渚嬶紝涓嶅瓨鍦ㄥ垯杩斿洖 null
   */
  findByKey(key: string, scope: SettingScope, contextId?: string): Promise<Setting | null>;

  /**
   * 鎸変綔鐢ㄥ煙鏌ユ壘鎵€鏈夎缃?
   *
   * @param scope 浣滅敤鍩?
   * @param contextId 涓婁笅鏂?ID锛坕dentityId 鎴?deviceId锛?
   * @param options.includeHistory 鏄惁鍔犺浇鍘嗗彶璁板綍
   * @returns 璁剧疆鍒楄〃
   */
  findByScope(
    scope: SettingScope,
    contextId?: string,
    options?: { includeHistory?: boolean },
  ): Promise<Setting[]>;

  /**
   * 鎸夊垎缁勬煡鎵捐缃?
   *
   * @param groupId 鍒嗙粍 UUID
   * @param options.includeHistory 鏄惁鍔犺浇鍘嗗彶璁板綍
   * @returns 璁剧疆鍒楄〃
   */
  findByGroup(groupId: string, options?: { includeHistory?: boolean }): Promise<Setting[]>;

  /**
   * 鏌ユ壘鎵€鏈夌郴缁熻缃?
   *
   * @param options.includeHistory 鏄惁鍔犺浇鍘嗗彶璁板綍
   * @returns 绯荤粺璁剧疆鍒楄〃
   */
  findSystemSettings(options?: { includeHistory?: boolean }): Promise<Setting[]>;

  /**
   * 鏌ユ壘鐢ㄦ埛璁剧疆
   *
   * @param identityId 璐︽埛 UUID
   * @param options.includeHistory 鏄惁鍔犺浇鍘嗗彶璁板綍
   * @returns 鐢ㄦ埛璁剧疆鍒楄〃
   */
  findUserSettings(identityId: string, options?: { includeHistory?: boolean }): Promise<Setting[]>;

  /**
   * 鏌ユ壘璁惧璁剧疆
   *
   * @param deviceId 璁惧 ID
   * @param options.includeHistory 鏄惁鍔犺浇鍘嗗彶璁板綍
   * @returns 璁惧璁剧疆鍒楄〃
   */
  findDeviceSettings(deviceId: string, options?: { includeHistory?: boolean }): Promise<Setting[]>;

  /**
   * 鍒犻櫎鑱氬悎鏍癸紙杞垹闄わ級
   *
   * 娉ㄦ剰锛?
   * - 杩欐槸杞垹闄ゆ搷浣?
   * - 璁剧疆 deletedAt 鏃堕棿鎴?
   *
   * @param id 璁剧疆 UUID
   */
  delete(id: string): Promise<void>;

  /**
   * 妫€鏌ヨ缃槸鍚﹀瓨鍦?
   *
   * @param id 璁剧疆 UUID
   */
  exists(id: string): Promise<boolean>;

  /**
   * 妫€鏌?key 鏄惁宸茶浣跨敤
   *
   * @param key 璁剧疆閿?
   * @param scope 浣滅敤鍩?
   * @param contextId 涓婁笅鏂?UUID
   */
  existsByKey(key: string, scope: SettingScope, contextId?: string): Promise<boolean>;

  /**
   * 鎵归噺淇濆瓨璁剧疆
   *
   * @param settings 璁剧疆鍒楄〃
   */
  saveMany(settings: Setting[]): Promise<void>;

  /**
   * 鎼滅储璁剧疆
   *
   * @param query 鎼滅储鏌ヨ
   * @param scope 鍙€夌殑浣滅敤鍩熻繃婊?
   * @returns 鍖归厤鐨勮缃垪琛?
   */
  search(query: string, scope?: SettingScope): Promise<Setting[]>;
}
