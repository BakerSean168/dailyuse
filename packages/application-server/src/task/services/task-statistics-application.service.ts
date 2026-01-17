import type {
  ITaskStatisticsRepository,
  ITaskTemplateRepository,
  ITaskInstanceRepository,
} from '@dailyuse/domain-server/task';
import { TaskStatistics } from '@dailyuse/domain-server/task';
import { TaskContainer } from '@dailyuse/infrastructure-server/task';
import type { TaskStatisticsServerDTO } from '@dailyuse/contracts/task';

/**
 * TaskStatistics 应用服务
 * 负责任务统计数据的管理和计算
 *
 * 架构职责�?
 * - 获取和更新统计数�?
 * - 触发重新计算
 * - DTO 转换（Domain �?Contracts�?
 */
export class TaskStatisticsApplicationService {
  private static instance: TaskStatisticsApplicationService;
  private statisticsRepository: ITaskStatisticsRepository;
  private templateRepository: ITaskTemplateRepository;
  private instanceRepository: ITaskInstanceRepository;

  private constructor(
    statisticsRepository: ITaskStatisticsRepository,
    templateRepository: ITaskTemplateRepository,
    instanceRepository: ITaskInstanceRepository,
  ) {
    this.statisticsRepository = statisticsRepository;
    this.templateRepository = templateRepository;
    this.instanceRepository = instanceRepository;
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    statisticsRepository?: ITaskStatisticsRepository,
    templateRepository?: ITaskTemplateRepository,
    instanceRepository?: ITaskInstanceRepository,
  ): Promise<TaskStatisticsApplicationService> {
    const container = TaskContainer.getInstance();
    const statsRepo = statisticsRepository || container.getTaskStatisticsRepository();
    const templateRepo = templateRepository || container.getTaskTemplateRepository();
    const instanceRepo = instanceRepository || container.getTaskInstanceRepository();

    TaskStatisticsApplicationService.instance = new TaskStatisticsApplicationService(
      statsRepo,
      templateRepo,
      instanceRepo,
    );
    return TaskStatisticsApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<TaskStatisticsApplicationService> {
    if (!TaskStatisticsApplicationService.instance) {
      TaskStatisticsApplicationService.instance =
        await TaskStatisticsApplicationService.createInstance();
    }
    return TaskStatisticsApplicationService.instance;
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

    // 2. 如果不存在或需要强制重算，则重新计�?
    if (!statistics || forceRecalculate) {
      statistics = await this.recalculateStatistics(accountUuid);
    }

    // 3. 返回 ServerDTO
    return statistics.toServerDTO();
  }

  /**
   * 重新计算任务统计数据
   * @param accountUuid 账户UUID
   * @param force 是否强制重算（即使已存在�?
   */
  async recalculateStatistics(
    accountUuid: string,
    force = false,
  ): Promise<TaskStatistics> {
    // 1. 获取现有统计（如果存在）
    const existing = await this.statisticsRepository.findByAccountUuid(accountUuid);

    // 2. 如果已存在且不强制重算，直接返回
    if (existing && !force) {
      return existing;
    }

    // 3. 获取所有模板和实例数据
    const templates = await this.templateRepository.findByAccount(accountUuid);
    const instances = await this.instanceRepository.findByAccount(accountUuid);

    // 4. 创建或更新统计数�?
    let statistics: TaskStatistics;
    if (existing) {
      // 更新现有统计
      statistics = existing;
      statistics.recalculate(templates, instances);
    } else {
      // 创建新统�?
      statistics = TaskStatistics.createDefault(accountUuid);
      statistics.recalculate(templates, instances);
    }

    // 5. 保存统计数据
    await this.statisticsRepository.save(statistics);

    return statistics;
  }

  /**
   * 更新模板统计信息
   * @param accountUuid 账户UUID
   */
  async updateTemplateStats(accountUuid: string): Promise<void> {
    // 1. 获取现有统计
    const statistics = await this.statisticsRepository.findByAccountUuid(accountUuid);
    if (!statistics) {
      // 如果不存在，触发完整重算
      await this.recalculateStatistics(accountUuid);
      return;
    }

    // 2. 获取模板数据并计算统计信�?
    const templates = await this.templateRepository.findByAccount(accountUuid);
    
    // 3. 计算模板统计（这里需要计算逻辑，暂时触发重算）
    await this.recalculateStatistics(accountUuid);
  }

  /**
   * 更新实例统计信息
   * @param accountUuid 账户UUID
   */
  async updateInstanceStats(accountUuid: string): Promise<void> {
    // 1. 获取现有统计
    const statistics = await this.statisticsRepository.findByAccountUuid(accountUuid);
    if (!statistics) {
      // 如果不存在，触发完整重算
      await this.recalculateStatistics(accountUuid);
      return;
    }

    // 2. 获取实例数据并计算统计信�?
    const instances = await this.instanceRepository.findByAccount(accountUuid);

    // 3. 计算实例统计（这里需要计算逻辑，暂时触发重算）
    await this.recalculateStatistics(accountUuid);
  }

  /**
   * 更新完成统计信息
   * @param accountUuid 账户UUID
   */
  async updateCompletionStats(accountUuid: string): Promise<void> {
    // 1. 获取现有统计
    const statistics = await this.statisticsRepository.findByAccountUuid(accountUuid);
    if (!statistics) {
      // 如果不存在，触发完整重算
      await this.recalculateStatistics(accountUuid);
      return;
    }

    // 2. 获取实例数据并计算统计信�?
    const instances = await this.instanceRepository.findByAccount(accountUuid);

    // 3. 计算完成统计（这里需要计算逻辑，暂时触发重算）
    await this.recalculateStatistics(accountUuid);
  }

  /**
   * 删除统计数据
   * @param accountUuid 账户UUID
   */
  async deleteStatistics(accountUuid: string): Promise<void> {
    const statistics = await this.statisticsRepository.findByAccountUuid(accountUuid);
    if (statistics) {
      await this.statisticsRepository.delete(statistics.uuid);
    }
  }

  /**
   * 获取今日完成�?
   * @param accountUuid 账户UUID
   */
  async getTodayCompletionRate(accountUuid: string): Promise<number> {
    const statistics = await this.statisticsRepository.findByAccountUuid(accountUuid);
    if (!statistics) {
      return 0;
    }
    return statistics.getTodayCompletionRate();
  }

  /**
   * 获取本周完成�?
   * @param accountUuid 账户UUID
   */
  async getWeekCompletionRate(accountUuid: string): Promise<number> {
    const statistics = await this.statisticsRepository.findByAccountUuid(accountUuid);
    if (!statistics) {
      return 0;
    }
    return statistics.getWeekCompletionRate();
  }

  /**
   * 获取效率趋势
   * @param accountUuid 账户UUID
   */
  async getEfficiencyTrend(
    accountUuid: string,
  ): Promise<'UP' | 'DOWN' | 'STABLE'> {
    const statistics = await this.statisticsRepository.findByAccountUuid(accountUuid);
    if (!statistics) {
      return 'STABLE';
    }
    return statistics.getEfficiencyTrend();
  }
}
