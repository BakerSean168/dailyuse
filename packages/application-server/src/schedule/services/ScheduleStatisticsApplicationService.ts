import type {
  IScheduleStatisticsRepository,
  IScheduleTaskRepository,
} from '@dailyuse/domain-server/schedule';
import { ScheduleStatisticsDomainService } from '@dailyuse/domain-server/schedule';
import { ScheduleContainer } from '../../infrastructure/di/ScheduleContainer';
import type { SourceModule, ScheduleStatisticsClientDTO } from '@dailyuse/contracts/schedule';

/**
 * ScheduleStatistics 应用服务
 * 负责协调统计相关的领域服务，处理业务用例
 *
 * 架构职责：
 * - 委托给 DomainService 处理业务逻辑
 * - 协调多个领域服务
 * - 事务管理
 * - DTO 转换（Domain ↔ Contracts）
 */
export class ScheduleStatisticsApplicationService {
  private static instance: ScheduleStatisticsApplicationService;
  private domainService: ScheduleStatisticsDomainService;

  private constructor(
    statisticsRepository: IScheduleStatisticsRepository,
    taskRepository: IScheduleTaskRepository,
  ) {
    this.domainService = new ScheduleStatisticsDomainService(statisticsRepository, taskRepository);
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    statisticsRepository?: IScheduleStatisticsRepository,
    taskRepository?: IScheduleTaskRepository,
  ): Promise<ScheduleStatisticsApplicationService> {
    const container = ScheduleContainer.getInstance();
    const statsRepo = statisticsRepository || container.getScheduleStatisticsRepository();
    const taskRepo = taskRepository || container.getScheduleTaskRepository();

    ScheduleStatisticsApplicationService.instance = new ScheduleStatisticsApplicationService(
      statsRepo,
      taskRepo,
    );
    return ScheduleStatisticsApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<ScheduleStatisticsApplicationService> {
    if (!ScheduleStatisticsApplicationService.instance) {
      ScheduleStatisticsApplicationService.instance =
        await ScheduleStatisticsApplicationService.createInstance();
    }
    return ScheduleStatisticsApplicationService.instance;
  }

  // ===== 统计查询 =====

  /**
   * 获取账户的统计信息（不存在则自动创建）
   */
  async getOrCreateStatistics(
    accountUuid: string,
  ): Promise<ScheduleStatisticsClientDTO> {
    // 委托给领域服务处理
    const statistics = await this.domainService.ensureStatisticsExists(accountUuid);

    // 转换为 ClientDTO（API 返回给客户端）
    return statistics.toClientDTO();
  }

  /**
   * 获取账户的统计信息（不自动创建）
   */
  async getStatistics(
    accountUuid: string,
  ): Promise<ScheduleStatisticsClientDTO | null> {
    // 委托给领域服务处理
    const statistics = await this.domainService.getStatistics(accountUuid);

    return statistics ? statistics.toClientDTO() : null;
  }

  /**
   * 获取模块级别的统计数据
   */
  async getModuleStatistics(
    accountUuid: string,
    module: SourceModule,
  ): Promise<{
    module: SourceModule;
    totalTasks: number;
    activeTasks: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
  } | null> {
    // 委托给领域服务处理
    return await this.domainService.getModuleStatistics(accountUuid, module);
  }

  /**
   * 获取所有模块的统计数据
   */
  async getAllModuleStatistics(accountUuid: string): Promise<
    Array<{
      module: SourceModule;
      totalTasks: number;
      activeTasks: number;
      totalExecutions: number;
      successfulExecutions: number;
      failedExecutions: number;
      successRate: number;
    }>
  > {
    // 委托给领域服务处理
    return await this.domainService.getAllModuleStatistics(accountUuid);
  }

  // ===== 统计管理 =====

  /**
   * 重新计算账户的统计数据（从任务数据重建）
   */
  async recalculateStatistics(
    accountUuid: string,
  ): Promise<ScheduleStatisticsClientDTO> {
    // 委托给领域服务处理
    const statistics = await this.domainService.recalculateStatistics(accountUuid);

    // 转换为 ClientDTO
    return statistics.toClientDTO();
  }

  /**
   * 重置账户的统计数据
   */
  async resetStatistics(accountUuid: string): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.resetStatistics(accountUuid);
  }

  /**
   * 删除账户的统计数据
   */
  async deleteStatistics(accountUuid: string): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.deleteStatistics(accountUuid);
  }

  // ===== 批量操作 =====

  /**
   * 批量重新计算统计数据
   */
  async recalculateStatisticsBatch(
    accountUuids: string[],
  ): Promise<ScheduleStatisticsClientDTO[]> {
    // 委托给领域服务处理
    const statisticsList = await this.domainService.recalculateStatisticsBatch(accountUuids);

    // 转换为 ClientDTO 数组
    return statisticsList.map((stats) => stats.toClientDTO());
  }

  /**
   * 批量重置统计数据
   */
  async resetStatisticsBatch(accountUuids: string[]): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.resetStatisticsBatch(accountUuids);
  }
}

