import type {
  IReminderStatisticsRepository,
  IReminderTemplateRepository,
  IReminderGroupRepository,
} from '@dailyuse/domain-server/reminder';
import { ReminderStatistics } from '@dailyuse/domain-server/reminder';
import { ReminderContainer } from '@dailyuse/infrastructure-server';
import type { ReminderTemplateServerDTO, ReminderGroupServerDTO, ReminderStatisticsServerDTO } from '@dailyuse/contracts/reminder';

/**
 * ReminderStatistics 应用服务
 * 负责提醒统计数据的管理和计算
 *
 * 架构职责：
 * - 获取和更新统计数据
 * - 触发重新计算
 * - DTO 转换（Domain ↔ Contracts）
 */
export class ReminderStatisticsApplicationService {
  private static instance: ReminderStatisticsApplicationService;
  private statisticsRepository: IReminderStatisticsRepository;
  private templateRepository: IReminderTemplateRepository;
  private groupRepository: IReminderGroupRepository;

  private constructor(
    statisticsRepository: IReminderStatisticsRepository,
    templateRepository: IReminderTemplateRepository,
    groupRepository: IReminderGroupRepository,
  ) {
    this.statisticsRepository = statisticsRepository;
    this.templateRepository = templateRepository;
    this.groupRepository = groupRepository;
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    statisticsRepository?: IReminderStatisticsRepository,
    templateRepository?: IReminderTemplateRepository,
    groupRepository?: IReminderGroupRepository,
  ): Promise<ReminderStatisticsApplicationService> {
    const container = ReminderContainer.getInstance();
    const statsRepo = statisticsRepository || container.getReminderStatisticsRepository();
    const templateRepo = templateRepository || container.getReminderTemplateRepository();
    const groupRepo = groupRepository || container.getReminderGroupRepository();

    ReminderStatisticsApplicationService.instance = new ReminderStatisticsApplicationService(
      statsRepo,
      templateRepo,
      groupRepo,
    );
    return ReminderStatisticsApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<ReminderStatisticsApplicationService> {
    if (!ReminderStatisticsApplicationService.instance) {
      ReminderStatisticsApplicationService.instance =
        await ReminderStatisticsApplicationService.createInstance();
    }
    return ReminderStatisticsApplicationService.instance;
  }

  // ===== ReminderStatistics 管理 =====

  /**
   * 获取提醒统计数据
   * @param accountUuid 账户UUID
   * @param forceRecalculate 是否强制重新计算
   */
  async getStatistics(
    accountUuid: string,
    forceRecalculate = false,
  ): Promise<ReminderStatisticsServerDTO> {
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
   * 重新计算提醒统计数据
   * @param accountUuid 账户UUID
   * @param force 是否强制重算（即使已存在）
   */
  async recalculateStatistics(accountUuid: string, force = false): Promise<ReminderStatistics> {
    // 1. 获取现有统计（如果存在）
    const existing = await this.statisticsRepository.findByAccountUuid(accountUuid);

    // 2. 如果已存在且不强制重算，直接返回
    if (existing && !force) {
      return existing;
    }

    // 3. 获取所有模板和分组数据
    const templates = await this.templateRepository.findByAccountUuid(accountUuid);
    const groups = await this.groupRepository.findByAccountUuid(accountUuid);

    // 4. 创建或更新统计数据
    let statistics: ReminderStatistics;
    if (existing) {
      // 更新现有统计
      statistics = existing;
      statistics.recalculate(templates, groups);
    } else {
      // 创建新统计
      statistics = ReminderStatistics.create({ accountUuid });
      statistics.recalculate(templates, groups);
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

    // 2. 获取模板数据并触发重算
    await this.recalculateStatistics(accountUuid);
  }

  /**
   * 更新分组统计信息
   * @param accountUuid 账户UUID
   */
  async updateGroupStats(accountUuid: string): Promise<void> {
    // 1. 获取现有统计
    const statistics = await this.statisticsRepository.findByAccountUuid(accountUuid);
    if (!statistics) {
      // 如果不存在，触发完整重算
      await this.recalculateStatistics(accountUuid);
      return;
    }

    // 2. 获取分组数据并触发重算
    await this.recalculateStatistics(accountUuid);
  }

  /**
   * 更新触发统计信息
   * @param accountUuid 账户UUID
   */
  async updateTriggerStats(accountUuid: string): Promise<void> {
    // 1. 获取现有统计
    const statistics = await this.statisticsRepository.findByAccountUuid(accountUuid);
    if (!statistics) {
      // 如果不存在，触发完整重算
      await this.recalculateStatistics(accountUuid);
      return;
    }

    // 2. 触发重算
    await this.recalculateStatistics(accountUuid);
  }

  /**
   * 删除统计数据
   * @param accountUuid 账户UUID
   */
  async deleteStatistics(accountUuid: string): Promise<void> {
    const statistics = await this.statisticsRepository.findByAccountUuid(accountUuid);
    if (statistics) {
      await this.statisticsRepository.delete(accountUuid);
    }
  }

  /**
   * 获取今日触发成功率
   * @param accountUuid 账户UUID
   */
  async getTodaySuccessRate(accountUuid: string): Promise<number> {
    const statistics = await this.statisticsRepository.findByAccountUuid(accountUuid);
    if (!statistics) {
      return 0;
    }
    return statistics.getTodaySuccessRate();
  }

  /**
   * 获取本周触发成功率
   * @param accountUuid 账户UUID
   */
  async getWeekSuccessRate(accountUuid: string): Promise<number> {
    const statistics = await this.statisticsRepository.findByAccountUuid(accountUuid);
    if (!statistics) {
      return 0;
    }
    return statistics.getWeekSuccessRate();
  }

  /**
   * 获取触发趋势
   * @param accountUuid 账户UUID
   */
  async getTriggerTrend(accountUuid: string): Promise<'UP' | 'DOWN' | 'STABLE'> {
    const statistics = await this.statisticsRepository.findByAccountUuid(accountUuid);
    if (!statistics) {
      return 'STABLE';
    }
    return statistics.getTriggerTrend();
  }
}

