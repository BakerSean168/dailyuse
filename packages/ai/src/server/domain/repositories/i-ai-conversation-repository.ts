/**
 * AI Conversation Repository Interface
 * AI 瀵硅瘽浠撳偍鎺ュ彛
 *
 * DDD 浠撳偍妯″紡锛?
 * - 鎿嶄綔棰嗗煙瀵硅薄锛堣仛鍚堟牴锛夛紝涓嶇洿鎺ユ搷浣滄暟鎹簱妯″瀷
 * - 鐢卞熀纭€璁炬柦灞傚疄鐜帮紙Prisma锛?
 * - 鑱氬悎鏍规ā寮忥細绾ц仈淇濆瓨/鍔犺浇 AIMessage
 */

import type { AIConversation } from '../aggregates/ai-conversation';
import { ConversationStatus } from '@dailyuse/contracts/ai';

/**
 * 鏌ヨ閫夐」
 */
export interface AIConversationQueryOptions {
  includeChildren?: boolean;
}

/**
 * IAIConversationRepository 浠撳偍鎺ュ彛
 *
 * 鑱岃矗锛?
 * - AI 瀵硅瘽鑱氬悎鏍圭殑鎸佷箙鍖栨搷浣?
 * - 绾ц仈淇濆瓨瀵硅瘽娑堟伅
 * - 鎸夎处鎴枫€佺姸鎬佹煡璇㈠璇?
 */
export interface IAIConversationRepository {
  /**
   * 淇濆瓨瀵硅瘽锛堝垱寤烘垨鏇存柊锛?
   * 娉ㄦ剰锛氱骇鑱斾繚瀛樻墍鏈夋秷鎭?
   */
  save(conversation: AIConversation): Promise<void>;

  /**
   * 鏍规嵁 UUID 鏌ユ壘瀵硅瘽
   * @param options.includeChildren 鏄惁鍔犺浇娑堟伅锛堥粯璁?false锛?
   */
  findById(id: string, options?: AIConversationQueryOptions): Promise<AIConversation | null>;

  /**
   * 鏍规嵁璐︽埛 UUID 鏌ユ壘鎵€鏈夊璇?
   */
  findByIdentityId(identityId: string, options?: AIConversationQueryOptions): Promise<AIConversation[]>;

  /**
   * 鏍规嵁鐘舵€佹煡鎵惧璇?
   */
  findByStatus(
    identityId: string,
    status: ConversationStatus,
    options?: AIConversationQueryOptions,
  ): Promise<AIConversation[]>;

  /**
   * 鏌ユ壘鏈€杩戠殑瀵硅瘽锛堝垎椤碉級
   */
  findRecent(
    identityId: string,
    limit: number,
    offset?: number,
  ): Promise<AIConversation[]>;

  /**
   * 鍒犻櫎瀵硅瘽锛堢骇鑱斿垹闄ゆ墍鏈夋秷鎭級
   */
  delete(id: string): Promise<void>;

  /**
   * 妫€鏌ュ璇濇槸鍚﹀瓨鍦?
   */
  exists(id: string): Promise<boolean>;
}
