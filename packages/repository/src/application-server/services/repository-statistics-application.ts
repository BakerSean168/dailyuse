/**
 * Repository Statistics Service
 *
 * Repository缁熻鐩稿叧鐨勫簲鐢ㄦ湇鍔?
 */

import type {
  IRepositoryStatisticsRepository,
  IRepositoryRepository,
} from '@/domain-server';
import { RepositoryStatisticsDomainService } from '@/domain-server';
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

  // ===== 缁熻鏌ヨ =====

  /**
   * Get璐︽埛鐨勭粺璁′俊鎭紙涓嶅瓨鍦ㄥ垯鑷姩Create锛?
   */
  async getOrCreateStatistics(accountUuid: string): Promise<RepositoryStatisticsServerDTO> {
    const statistics = await this.domainService.getOrCreateStatistics(accountUuid);
    return statistics.toClientDTO();
  }

  /**
   * Get璐︽埛鐨勭粺璁′俊鎭紙涓嶈嚜鍔ㄥ垱寤猴級
   */
  async getStatistics(accountUuid: string): Promise<RepositoryStatisticsServerDTO | null> {
    const statistics = await this.domainService.getStatistics(accountUuid);
    return statistics ? statistics.toClientDTO() : null;
  }

  /**
   * 鍒濆鍖栫粺璁′俊鎭?
   */
  async initializeStatistics(accountUuid: string): Promise<RepositoryStatisticsServerDTO> {
    const statistics = await this.domainService.initializeStatistics(accountUuid);
    return statistics.toClientDTO();
  }

  /**
   * 閲嶆柊璁＄畻缁熻淇℃伅
   */
  async recalculateStatistics(
    request: RecalculateStatisticsRequest,
  ): Promise<RecalculateStatisticsResponse> {
    return await this.domainService.recalculateStatistics(request);
  }

  /**
   * 澶勭悊缁熻Update浜嬩欢
   */
  async handleStatisticsUpdateEvent(event: StatisticsUpdateEvent): Promise<void> {
    await this.domainService.handleStatisticsUpdateEvent(event);
  }

  /**
   * Delete缁熻淇℃伅
   */
  async deleteStatistics(accountUuid: string): Promise<void> {
    await this.domainService.deleteStatistics(accountUuid);
  }

  /**
   * 鎵归噺Get澶氫釜璐︽埛鐨勭粺璁?
   */
  async getStatisticsByAccountUuids(
    accountUuids: string[],
  ): Promise<RepositoryStatisticsServerDTO[]> {
    const statisticsList = await this.domainService.getStatisticsByAccountUuids(accountUuids);
    return statisticsList.map((stats) => stats.toClientDTO());
  }

  /**
   * GetAll鏈夎处鎴风殑缁熻锛堝垎椤碉級
   */
  async getAllStatistics(options?: {
    skip?: number;
    take?: number;
  }): Promise<RepositoryStatisticsServerDTO[]> {
    const statisticsList = await this.domainService.getAllStatistics(options);
    return statisticsList.map((stats) => stats.toClientDTO());
  }

  /**
   * 缁熻璐︽埛鎬绘暟
   */
  async countStatistics(): Promise<number> {
    return await this.domainService.countStatistics();
  }
}

// ===== 渚挎嵎鍑芥暟 =====

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

