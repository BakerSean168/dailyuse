import type { ITaskStatisticsRepository } from '../../domain-server/repositories/ITaskStatisticsRepository';
import type { ITaskTemplateRepository } from '../../domain-server/repositories/ITaskTemplateRepository';
import type { ITaskInstanceRepository } from '../../domain-server/repositories/ITaskInstanceRepository';
import { TaskStatistics } from '../../domain-server/aggregates/task-statistics';
import type { TaskStatisticsServerDTO } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * TaskStatistics 搴旂敤鏈嶅姟
 * 璐熻矗浠诲姟缁熻鏁版嵁鐨勭鐞嗗拰璁＄畻
 *
 * 鏋舵瀯鑱岃矗锛?
 * - 鑾峰彇鍜屾洿鏂扮粺璁℃暟鎹?
 * - 瑙﹀彂閲嶆柊璁＄畻
 * - DTO 杞崲锛圖omain 鈫?Contracts锛?
 */
export class TaskStatisticsApplicationService {
  private statisticsRepository: ITaskStatisticsRepository;
  private templateRepository: ITaskTemplateRepository;
  private instanceRepository: ITaskInstanceRepository;

  constructor(
    statisticsRepository: ITaskStatisticsRepository,
    templateRepository: ITaskTemplateRepository,
    instanceRepository: ITaskInstanceRepository,
  ) {
    this.statisticsRepository = statisticsRepository;
    this.templateRepository = templateRepository;
    this.instanceRepository = instanceRepository;
  }

  // ===== TaskStatistics 绠＄悊 =====

  /**
   * 鑾峰彇浠诲姟缁熻鏁版嵁
   * @param identityId 璐︽埛UUID
   * @param forceRecalculate 鏄惁寮哄埗閲嶆柊璁＄畻
   */
  async getStatistics(
    identityId: string,
    forceRecalculate = false,
  ): Promise<Result<TaskStatisticsServerDTO>> {
    // 1. 灏濊瘯浠庢暟鎹簱鑾峰彇鐜版湁缁熻鏁版嵁
    let statistics = await this.statisticsRepository.findByIdentityId(identityId);

    // 2. 濡傛灉涓嶅瓨鍦ㄦ垨闇€瑕佸己鍒堕噸绠楋紝鍒欓噸鏂拌绠?
    if (!statistics || forceRecalculate) {
      const recalcResult = await this.recalculateStatistics(identityId);
      if (!recalcResult.ok) {
        return recalcResult as any;
      }
      statistics = recalcResult.data;
    }

    // 3. 杩斿洖 ServerDTO
    return ok(statistics.toServerDTO());
  }

  /**
   * 閲嶆柊璁＄畻浠诲姟缁熻鏁版嵁
   * @param identityId 璐︽埛UUID
   * @param force 鏄惁寮哄埗閲嶇畻锛堝嵆浣垮凡瀛樺湪锛?
   */
  async recalculateStatistics(
    identityId: string,
    force = false,
  ): Promise<Result<TaskStatistics>> {
    // 1. 鑾峰彇鐜版湁缁熻锛堝鏋滃瓨鍦級
    const existing = await this.statisticsRepository.findByIdentityId(identityId);

    // 2. 濡傛灉瀛樺湪涓斾笉寮哄埗閲嶇畻锛岀洿鎺ヨ繑鍥?
    if (existing && !force) {
      return ok(existing);
    }

    // 3. 璁＄畻鏂扮粺璁℃暟鎹?
    // TODO: 瀹炵幇鍏蜂綋鐨勭粺璁¤绠楅€昏緫锛岀洰鍓嶈繑鍥炵┖缁熻
    // 闇€瑕佷粠 InstanceRepository 鍜?TemplateRepository 鑱氬悎鏁版嵁
    
    // 涓存椂瀹炵幇锛氬垱寤烘柊鐨勭粺璁″璞?
    const newStats = TaskStatistics.createDefault(identityId);

    // 4. 淇濆瓨
    await this.statisticsRepository.save(newStats);

    return ok(newStats);
  }
}
