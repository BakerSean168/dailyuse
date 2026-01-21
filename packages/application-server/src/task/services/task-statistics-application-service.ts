import type {
  ITaskStatisticsRepository,
  ITaskTemplateRepository,
  ITaskInstanceRepository,
} from '@dailyuse/domain-server/task';
import { TaskStatistics } from '@dailyuse/domain-server/task';
import type { TaskStatisticsServerDTO } from '@dailyuse/contracts/task';

/**
 * TaskStatistics 应用服务
 * 负责任务统计数据的管理和计算
 *
 * 架构职责：
 * - 获取和更新统计数据
 * - 触发重新计算
 * - DTO 转换（Domain ↔ Contracts）
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

  // ===== TaskStatistics 管理 =====

  /**
   * 获取任务统计数据
   * @param accountUuid 账户UUID
   * @param forceRecalculate 是否强制重新计算
   */
  async getStatistics(
    accountUuid: string,
    forceRecalculate = false,
  ): Promise<TaskStatisticsServerDTO> {
    // 1. 尝试从数据库获取现有统计数据
    let statistics = await this.statisticsRepository.findByAccountUuid(accountUuid);

    // 2. 如果不存在或需要强制重算，则重新计算
    if (!statistics || forceRecalculate) {
      statistics = await this.recalculateStatistics(accountUuid);
    }

    // 3. 返回 ServerDTO
    return statistics.toServerDTO();
  }

  /**
   * 重新计算任务统计数据
   * @param accountUuid 账户UUID
   * @param force 是否强制重算（即使已存在）
   */
  async recalculateStatistics(
    accountUuid: string,
    force = false,
  ): Promise<TaskStatistics> {
    // 1. 获取现有统计（如果存在）
    const existing = await this.statisticsRepository.findByAccountUuid(accountUuid);

    // 2. 如果存在且不强制重算，直接返回
    if (existing && !force) {
      return existing;
    }

    // 3. 计算新统计数据
    // TODO: 实现具体的统计计算逻辑，目前返回空统计
    // 需要从 InstanceRepository 和 TemplateRepository 聚合数据
    
    // 临时实现：创建新的统计对象
    const newStats = TaskStatistics.create({
      accountUuid,
      totalTasks: 0,
      completedTasks: 0,
      activeTasks: 0,
      overdueTasks: 0,
    });

    // 4. 保存
    await this.statisticsRepository.save(newStats);

    return newStats;
  }
}
