import type {
  IRepositoryStatisticsRepository,
  IRepositoryRepository,
} from '@dailyuse/domain-server/repository';
import { RepositoryStatisticsDomainService } from '@dailyuse/domain-server/repository';
import { RepositoryContainer } from '@dailyuse/infrastructure-server';
import type { 
  RepositoryServerDTO, 
  ResourceServerDTO, 
  FolderServerDTO,
  RepositoryStatisticsServerDTO,
  RecalculateStatisticsRequest,
  RecalculateStatisticsResponse,
  StatisticsUpdateEvent,
} from '@dailyuse/contracts/repository';

/**
 * RepositoryStatistics 应用服务
 * 负责协调统计相关的领域服务，处理业务用例
 *
 * 架构职责：
 * - 委托给 DomainService 处理业务逻辑
 * - 协调多个领域服务
 * - 事务管理
 * - DTO 转换（Domain ↔ Contracts）
 */
export class RepositoryStatisticsApplicationService {
  private static instance: RepositoryStatisticsApplicationService;
  private domainService: RepositoryStatisticsDomainService;

  private constructor(
    statisticsRepository: IRepositoryStatisticsRepository,
    repositoryRepository: IRepositoryRepository,
  ) {
    this.domainService = new RepositoryStatisticsDomainService(
      statisticsRepository,
      repositoryRepository,
    );
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    statisticsRepository?: IRepositoryStatisticsRepository,
    repositoryRepository?: IRepositoryRepository,
  ): Promise<RepositoryStatisticsApplicationService> {
    const container = RepositoryContainer.getInstance();
    const statsRepo = statisticsRepository || container.getRepositoryStatisticsRepository();
    const repoRepo = repositoryRepository || container.getRepositoryAggregateRepository();

    RepositoryStatisticsApplicationService.instance = new RepositoryStatisticsApplicationService(
      statsRepo,
      repoRepo,
    );
    return RepositoryStatisticsApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<RepositoryStatisticsApplicationService> {
    if (!RepositoryStatisticsApplicationService.instance) {
      RepositoryStatisticsApplicationService.instance =
        await RepositoryStatisticsApplicationService.createInstance();
    }
    return RepositoryStatisticsApplicationService.instance;
  }

  // ===== 统计查询 =====

  /**
   * 获取账户的统计信息（不存在则自动创建）
   */
  async getOrCreateStatistics(
    accountUuid: string,
  ): Promise<RepositoryStatisticsServerDTO> {
    // 委托给领域服务处理
    const statistics = await this.domainService.getOrCreateStatistics(accountUuid);

    // 转换为 DTO
    return statistics.toClientDTO();
  }

  /**
   * 获取账户的统计信息（不自动创建）
   */
  async getStatistics(
    accountUuid: string,
  ): Promise<RepositoryStatisticsServerDTO | null> {
    // 委托给领域服务处理
    const statistics = await this.domainService.getStatistics(accountUuid);

    return statistics ? statistics.toClientDTO() : null;
  }

  /**
   * 初始化统计信息
   */
  async initializeStatistics(
    accountUuid: string,
  ): Promise<RepositoryStatisticsServerDTO> {
    // 委托给领域服务处理
    const statistics = await this.domainService.initializeStatistics(accountUuid);

    // 转换为 DTO
    return statistics.toClientDTO();
  }

  /**
   * 重新计算统计信息
   */
  async recalculateStatistics(
    request: RecalculateStatisticsRequest,
  ): Promise<RecalculateStatisticsResponse> {
    // 委托给领域服务处理（Response 已经是 DTO 格式）
    return await this.domainService.recalculateStatistics(request);
  }

  /**
   * 处理统计更新事件
   */
  async handleStatisticsUpdateEvent(
    event: StatisticsUpdateEvent,
  ): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.handleStatisticsUpdateEvent(event);
  }

  /**
   * 删除统计信息
   */
  async deleteStatistics(accountUuid: string): Promise<void> {
    // 委托给领域服务处理
    await this.domainService.deleteStatistics(accountUuid);
  }

  /**
   * 批量获取多个账户的统计
   */
  async getStatisticsByAccountUuids(
    accountUuids: string[],
  ): Promise<RepositoryStatisticsServerDTO[]> {
    // 委托给领域服务处理
    const statisticsList = await this.domainService.getStatisticsByAccountUuids(accountUuids);

    // 转换为 DTO 数组
    return statisticsList.map((stats) => stats.toClientDTO());
  }

  /**
   * 获取所有账户的统计（分页）
   */
  async getAllStatistics(options?: {
    skip?: number;
    take?: number;
  }): Promise<RepositoryStatisticsServerDTO[]> {
    // 委托给领域服务处理
    const statisticsList = await this.domainService.getAllStatistics(options);

    // 转换为 DTO 数组
    return statisticsList.map((stats) => stats.toClientDTO());
  }

  /**
   * 统计账户总数
   */
  async countStatistics(): Promise<number> {
    // 委托给领域服务处理
    return await this.domainService.countStatistics();
  }
}


