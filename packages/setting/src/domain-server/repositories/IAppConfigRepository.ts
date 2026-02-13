/**
 * AppConfig Repository Interface
 * 搴旂敤閰嶇疆浠撳偍鎺ュ彛
 *
 * DDD 浠撳偍妯″紡锛?
 * - 鍙畾涔夋帴鍙ｏ紝涓嶅疄鐜?
 * - 鐢卞熀纭€璁炬柦灞傚疄鐜?
 */

// import type { AppConfigServer } from '../aggregates/AppConfigServer';

/**
 * IAppConfigRepository 浠撳偍鎺ュ彛
 *
 * 鑱岃矗锛?
 * - 瀹氫箟 AppConfig 鑱氬悎鏍圭殑鎸佷箙鍖栨搷浣?
 * - 搴旂敤閰嶇疆閫氬父鏄崟渚?
 */
export interface IAppConfigRepository {
  /**
   * 淇濆瓨搴旂敤閰嶇疆锛堝垱寤烘垨鏇存柊锛?
   */
  save(config: any): Promise<void>;

  /**
   * 閫氳繃 UUID 鏌ユ壘搴旂敤閰嶇疆
   *
   * @param id 閰嶇疆 UUID
   * @returns 鑱氬悎鏍瑰疄渚嬶紝涓嶅瓨鍦ㄥ垯杩斿洖 null
   */
  findById(id: string): Promise<any | null>;

  /**
   * 鑾峰彇褰撳墠搴旂敤閰嶇疆
   *
   * @returns 褰撳墠鐢熸晥鐨勯厤缃?
   */
  getCurrent(): Promise<any | null>;

  /**
   * 閫氳繃鐗堟湰鍙锋煡鎵鹃厤缃?
   *
   * @param version 鐗堟湰鍙?
   * @returns 鑱氬悎鏍瑰疄渚嬶紝涓嶅瓨鍦ㄥ垯杩斿洖 null
   */
  findByVersion(version: string): Promise<any | null>;

  /**
   * 鑾峰彇鎵€鏈夊巻鍙茬増鏈?
   *
   * @returns 閰嶇疆鍘嗗彶鍒楄〃锛堟寜鏃堕棿鍊掑簭锛?
   */
  findAllVersions(): Promise<any[]>;

  /**
   * 鍒犻櫎閰嶇疆
   *
   * @param id 閰嶇疆 UUID
   */
  delete(id: string): Promise<void>;

  /**
   * 妫€鏌ラ厤缃槸鍚﹀瓨鍦?
   *
   * @param id 閰嶇疆 UUID
   */
  exists(id: string): Promise<boolean>;

  /**
   * 妫€鏌ョ増鏈槸鍚﹀瓨鍦?
   *
   * @param version 鐗堟湰鍙?
   */
  existsByVersion(version: string): Promise<boolean>;
}
