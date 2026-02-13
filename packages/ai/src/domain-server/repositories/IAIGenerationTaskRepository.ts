/**
 * AI Generation Task Repository Interface
 * AI 鐢熸垚浠诲姟浠撳偍鎺ュ彛
 *
 * DDD 浠撳偍妯″紡锛?
 * - 鎿嶄綔棰嗗煙瀵硅薄锛圫erverDTO锛夛紝涓嶇洿鎺ユ搷浣滄暟鎹簱妯″瀷
 * - 鐢卞熀纭€璁炬柦灞傚疄鐜帮紙Prisma锛?
 * - 闅愯棌鎸佷箙鍖栫粏鑺?
 */

import type { AIGenerationTaskServerDTO, TaskStatus } from '@dailyuse/contracts/ai';
import { GenerationTaskType } from '@dailyuse/contracts/ai';

/**
 * IAIGenerationTaskRepository 浠撳偍鎺ュ彛
 *
 * 鑱岃矗锛?
 * - AI 鐢熸垚浠诲姟鐨勬寔涔呭寲鎿嶄綔
 * - 鎸夎处鎴枫€佺被鍨嬨€佺姸鎬佹煡璇换鍔?
 * - 浠诲姟鍘嗗彶璁板綍
 */
export interface IAIGenerationTaskRepository {
  /**
   * 淇濆瓨浠诲姟锛堝垱寤烘垨鏇存柊锛?
   */
  save(task: AIGenerationTaskServerDTO): Promise<void>;

  /**
   * 鏍规嵁 UUID 鏌ユ壘浠诲姟
   */
  findById(id: string): Promise<AIGenerationTaskServerDTO | null>;

  /**
   * 鏍规嵁璐︽埛 UUID 鏌ユ壘鎵€鏈変换鍔?
   */
  findByIdentityId(identityId: string): Promise<AIGenerationTaskServerDTO[]>;

  /**
   * 鏍规嵁浠诲姟绫诲瀷鏌ユ壘浠诲姟
   */
  findByTaskType(
    identityId: string,
    taskType: GenerationTaskType,
  ): Promise<AIGenerationTaskServerDTO[]>;

  /**
   * 鏍规嵁鐘舵€佹煡鎵句换鍔?
   */
  findByStatus(identityId: string, status: TaskStatus): Promise<AIGenerationTaskServerDTO[]>;

  /**
   * 鏌ユ壘鏈€杩戠殑浠诲姟锛堝垎椤碉級
   */
  findRecent(
    identityId: string,
    limit: number,
    offset?: number,
  ): Promise<AIGenerationTaskServerDTO[]>;

  /**
   * 鍒犻櫎浠诲姟
   */
  delete(id: string): Promise<void>;

  /**
   * 妫€鏌ヤ换鍔℃槸鍚﹀瓨鍦?
   */
  exists(id: string): Promise<boolean>;
}
