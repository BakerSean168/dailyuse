/**
 * AI Usage Quota Repository Interface
 * AI 浣跨敤閰嶉浠撳偍鎺ュ彛
 *
 * DDD 浠撳偍妯″紡锛?
 * - 鎿嶄綔棰嗗煙瀵硅薄锛圫erverDTO锛夛紝涓嶇洿鎺ユ搷浣滄暟鎹簱妯″瀷
 * - 鐢卞熀纭€璁炬柦灞傚疄鐜帮紙Prisma锛?
 * - 闅愯棌鎸佷箙鍖栫粏鑺?
 */

import type { AIUsageQuotaServerDTO } from '@dailyuse/contracts/ai';

/**
 * IAIUsageQuotaRepository 浠撳偍鎺ュ彛
 *
 * 鑱岃矗锛?
 * - AI 浣跨敤閰嶉鐨勬寔涔呭寲鎿嶄綔
 * - 鎸夎处鎴锋煡璇㈤厤棰?
 * - 鏇存柊閰嶉浣跨敤鎯呭喌
 */
export interface IAIUsageQuotaRepository {
  /**
   * 淇濆瓨閰嶉锛堝垱寤烘垨鏇存柊锛?
   */
  save(quota: AIUsageQuotaServerDTO): Promise<void>;

  /**
   * 鏍规嵁 UUID 鏌ユ壘閰嶉
   */
  findById(id: string): Promise<AIUsageQuotaServerDTO | null>;

  /**
   * 鏍规嵁璐︽埛 UUID 鏌ユ壘閰嶉锛堟瘡涓处鎴峰彧鏈変竴鏉￠厤棰濊褰曪級
   */
  findByIdentityId(identityId: string): Promise<AIUsageQuotaServerDTO | null>;

  /**
   * 鍒涘缓榛樿閰嶉锛堝鏋滀笉瀛樺湪锛?
   */
  createDefaultQuota(identityId: string): Promise<AIUsageQuotaServerDTO>;

  /**
   * 鍒犻櫎閰嶉
   */
  delete(id: string): Promise<void>;

  /**
   * 妫€鏌ラ厤棰濇槸鍚﹀瓨鍦?
   */
  exists(identityId: string): Promise<boolean>;
}
