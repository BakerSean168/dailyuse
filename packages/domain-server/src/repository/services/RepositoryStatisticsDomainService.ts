/**
 * RepositoryStatisticsDomainService - 仓库统计领域服务
 * 
 * 职责：
 * - 统计数据的业务逻辑
 * - 统计计算和更新
 */

import type { IRepositoryStatisticsRepository } from '../repositories/IRepositoryStatisticsRepository';
import type { IRepositoryRepository } from '../repositories/IRepositoryRepository';
import { RepositoryStatistics, type RepositoryStatisticsServerDTO } from '../aggregates/RepositoryStatistics';

// ============ 本地类型定义 ============
// TODO: 这些类型应该移到 @dailyuse/contracts/repository

/**
 * Recalculate Statistics Request
 */
export interface RecalculateStatisticsRequest {
  accountUuid: string;
}

/**
 * Recalculate Statistics Response
 */
export interface RecalculateStatisticsResponse {
  ok: boolean;
  message: string;
  statistics: RepositoryStatisticsServerDTO;
  recalculatedAt: number;
}

/**
 * Statistics Update Event
 */
export interface StatisticsUpdateEvent {
  accountUuid: string;
  eventType: string;
  data?: unknown;
}

export class RepositoryStatisticsDomainService {
  constructor(
    private statisticsRepository: IRepositoryStatisticsRepository,
    private repositoryRepository: IRepositoryRepository,
  ) {}

  /**
   * 获取或创建统计数据
   */
  async getOrCreateStatistics(accountUuid: string): Promise<RepositoryStatistics> {
    let statistics = await this.statisticsRepository.findByAccountUuid(accountUuid);
    
    if (!statistics) {
      statistics = RepositoryStatistics.createDefault(accountUuid);
      await this.statisticsRepository.save(statistics);
    }
    
    return statistics;
  }

  /**
   * 获取统计数据（不自动创建）
   */
  async getStatistics(accountUuid: string): Promise<RepositoryStatistics | null> {
    return await this.statisticsRepository.findByAccountUuid(accountUuid);
  }

  /**
   * 初始化统计数据
   */
  async initializeStatistics(accountUuid: string): Promise<RepositoryStatistics> {
    const statistics = RepositoryStatistics.createDefault(accountUuid);
    await this.statisticsRepository.save(statistics);
    return statistics;
  }

  /**
   * 重新计算统计数据
   */
  async recalculateStatistics(request: RecalculateStatisticsRequest): Promise<RecalculateStatisticsResponse> {
    try {
      const statistics = await this.getOrCreateStatistics(request.accountUuid);
      
      // 获取仓库数据
      const repositories = await this.repositoryRepository.findByAccountUuid(request.accountUuid);
      
      // 计算统计
      statistics.update({
        totalRepositories: repositories.length,
        // 其他统计可以在这里计算
      });
      
      await this.statisticsRepository.save(statistics);
      
      return {
        ok: true,
        message: 'Statistics recalculated successfully',
        statistics: statistics.toClientDTO(),
        recalculatedAt: Date.now(),
      };
    } catch (error) {
      const defaultStats: RepositoryStatisticsServerDTO = {
        uuid: '',
        accountUuid: request.accountUuid,
        totalRepositories: 0,
        activeRepositories: 0,
        archivedRepositories: 0,
        totalResources: 0,
        totalFolders: 0,
        totalTags: 0,
        totalStorageBytes: 0,
        lastUpdatedAt: 0,
        createdAt: 0,
        updatedAt: 0,
      };
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        statistics: defaultStats,
        recalculatedAt: Date.now(),
      };
    }
  }

  /**
   * 处理统计更新事件
   */
  async handleStatisticsUpdateEvent(event: StatisticsUpdateEvent): Promise<void> {
    const statistics = await this.getOrCreateStatistics(event.accountUuid);
    
    // 根据事件类型更新统计
    // TODO: 实现具体的事件处理逻辑
    
    await this.statisticsRepository.save(statistics);
  }

  /**
   * 删除统计数据
   */
  async deleteStatistics(accountUuid: string): Promise<void> {
    const statistics = await this.statisticsRepository.findByAccountUuid(accountUuid);
    if (statistics) {
      await this.statisticsRepository.delete(statistics.uuid);
    }
  }

  /**
   * 批量获取统计数据
   */
  async getStatisticsByAccountUuids(accountUuids: string[]): Promise<RepositoryStatistics[]> {
    return await this.statisticsRepository.findByAccountUuids(accountUuids);
  }

  /**
   * 获取所有统计数据（分页）
   */
  async getAllStatistics(options?: { skip?: number; take?: number }): Promise<RepositoryStatistics[]> {
    return await this.statisticsRepository.findAll(options);
  }

  /**
   * 统计账户总数
   */
  async countStatistics(): Promise<number> {
    return await this.statisticsRepository.count();
  }
}
