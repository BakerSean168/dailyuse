/**
 * Repository Statistics Service
 *
 * 仓储统计相关的应用服务
 */

import type {
  IRepositoryStatisticsRepository,
  IRepositoryRepository,
} from '@dailyuse/domain-server/repository';
import { RepositoryStatisticsDomainService } from '@dailyuse/domain-server/repository';
import type {
  RepositoryStatisticsServerDTO,
  RecalculateStatisticsRequest,
  RecalculateStatisticsResponse,
  StatisticsUpdateEvent,
} from '@dailyuse/contracts/repository';

/**
 * Repository Statistics Service
 */
export class RepositoryStatisticsService {
  private domainService: RepositoryStatisticsDomainService;

  constructor(
    statisticsRepository: IRepositoryStatisticsRepository,
    repositoryRepository: IRepositoryRepository,
  ) {
    this.domainService = new RepositoryStatisticsDomainService(
      statisticsRepository,
      repositoryRepository,
    );
  }

  // ===== 统计查询 =====

  /**
   * 获取账户的统计信息（不存在则自动创建）
   */
  async getOrCreateStatistics(accountUuid: string): Promise<RepositoryStatisticsServerDTO> {
    const statistics = await this.domainService.getOrCreateStatistics(accountUuid);
    return statistics.toClientDTO();
  }

  /**
   * 获取账户的统计信息（不自动创建）
   */
  async getStatistics(accountUuid: string): Promise<RepositoryStatisticsServerDTO | null> {
    const statistics = await this.domainService.getStatistics(accountUuid);
    return statistics ? statistics.toClientDTO() : null;
  }

  /**
   * 初始化统计信息
   */
  async initializeStatistics(accountUuid: string): Promise<RepositoryStatisticsServerDTO> {
    const statistics = await this.domainService.initializeStatistics(accountUuid);
    return statistics.toClientDTO();
  }

  /**
   * 重新计算统计信息
   */
  async recalculateStatistics(
    request: RecalculateStatisticsRequest,
  ): Promise<RecalculateStatisticsResponse> {
    return await this.domainService.recalculateStatistics(request);
  }

  /**
   * 处理统计更新事件
   */
  async handleStatisticsUpdateEvent(event: StatisticsUpdateEvent): Promise<void> {
    await this.domainService.handleStatisticsUpdateEvent(event);
  }

  /**
   * 删除统计信息
   */
  async deleteStatistics(accountUuid: string): Promise<void> {
    await this.domainService.deleteStatistics(accountUuid);
  }

  /**
   * 批量获取多个账户的统计
   */
  async getStatisticsByAccountUuids(
    accountUuids: string[],
  ): Promise<RepositoryStatisticsServerDTO[]> {
    const statisticsList = await this.domainService.getStatisticsByAccountUuids(accountUuids);
    return statisticsList.map((stats) => stats.toClientDTO());
  }

  /**
   * 获取所有账户的统计（分页）
   */
  async getAllStatistics(options?: {
    skip?: number;
    take?: number;
  }): Promise<RepositoryStatisticsServerDTO[]> {
    const statisticsList = await this.domainService.getAllStatistics(options);
    return statisticsList.map((stats) => stats.toClientDTO());
  }

  /**
   * 统计账户总数
   */
  async countStatistics(): Promise<number> {
    return await this.domainService.countStatistics();
  }
}

// ===== 便捷函数 =====

export const getOrCreateStatistics = (accountUuid: string, service: RepositoryStatisticsService) =>
  service.getOrCreateStatistics(accountUuid);

export const getStatistics = (accountUuid: string, service: RepositoryStatisticsService) =>
  service.getStatistics(accountUuid);

export const initializeStatistics = (accountUuid: string, service: RepositoryStatisticsService) =>
  service.initializeStatistics(accountUuid);

export const recalculateStatistics = (request: RecalculateStatisticsRequest, service: RepositoryStatisticsService) =>
  service.recalculateStatistics(request);

export const handleStatisticsUpdateEvent = (event: StatisticsUpdateEvent, service: RepositoryStatisticsService) =>
  service.handleStatisticsUpdateEvent(event);

export const deleteStatistics = (accountUuid: string, service: RepositoryStatisticsService) =>
  service.deleteStatistics(accountUuid);
