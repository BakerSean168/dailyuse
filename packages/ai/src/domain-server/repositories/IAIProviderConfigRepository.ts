/**
 * AI Provider Config Repository Interface
 * AI 鏈嶅姟鎻愪緵鍟嗛厤缃粨鍌ㄦ帴鍙?
 *
 * DDD 浠撳偍妯″紡锛?
 * - 鎿嶄綔棰嗗煙瀵硅薄锛圫erverDTO锛夛紝涓嶇洿鎺ユ搷浣滄暟鎹簱妯″瀷
 * - 鐢卞熀纭€璁炬柦灞傚疄鐜帮紙Prisma锛?
 */

import type { AIProviderConfigServerDTO } from '@dailyuse/contracts/ai';

/**
 * IAIProviderConfigRepository 浠撳偍鎺ュ彛
 *
 * 鑱岃矗锛?
 * - AI Provider 閰嶇疆鐨勬寔涔呭寲鎿嶄綔
 * - 鎸夎处鎴锋煡璇㈤厤缃垪琛?
 * - 绠＄悊榛樿 Provider 鐘舵€?
 */
export interface IAIProviderConfigRepository {
  /**
   * 淇濆瓨閰嶇疆锛堝垱寤烘垨鏇存柊锛?
   */
  save(config: AIProviderConfigServerDTO): Promise<void>;

  /**
   * 鏍规嵁 UUID 鏌ユ壘閰嶇疆
   */
  findById(id: string): Promise<AIProviderConfigServerDTO | null>;

  /**
   * 鏍规嵁璐︽埛 UUID 鏌ユ壘鎵€鏈夐厤缃?
   */
  findByIdentityId(identityId: string): Promise<AIProviderConfigServerDTO[]>;

  /**
   * 鏌ユ壘璐︽埛鐨勯粯璁?Provider
   */
  findDefaultByIdentityId(identityId: string): Promise<AIProviderConfigServerDTO | null>;

  /**
   * 鏍规嵁璐︽埛鍜屽悕绉版煡鎵撅紙鐢ㄤ簬鍞竴鎬ф鏌ワ級
   */
  findByIdentityIdAndName(
    identityId: string,
    name: string,
  ): Promise<AIProviderConfigServerDTO | null>;

  /**
   * 鍒犻櫎閰嶇疆
   */
  delete(id: string): Promise<void>;

  /**
   * 妫€鏌ラ厤缃槸鍚﹀瓨鍦?
   */
  exists(id: string): Promise<boolean>;

  /**
   * 鍙栨秷璐︽埛涓嬫墍鏈?Provider 鐨勯粯璁ょ姸鎬?
   * 鐢ㄤ簬璁剧疆鏂伴粯璁?Provider 涔嬪墠
   */
  clearDefaultForIdentity(identityId: string): Promise<void>;
}
