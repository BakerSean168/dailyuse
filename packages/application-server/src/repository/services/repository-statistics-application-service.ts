import type {
  IRepositoryStatisticsRepository,
  IRepositoryRepository,
} from '@dailyuse/domain-server/repository';
import { RepositoryStatisticsDomainService } from '@dailyuse/domain-server/repository';
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
 * RepositoryStatistics 搴旂敤鏈嶅姟
 * 璐熻矗鍗忚皟缁熻鐩稿叧鐨勯鍩熸湇鍔★紝澶勭悊涓氬姟鐢ㄤ緥
 *
 * 鏋舵瀯鑱岃矗锛?
 * - 濮旀墭缁?DomainService 澶勭悊涓氬姟閫昏緫
 * - 鍗忚皟澶氫釜棰嗗煙鏈嶅姟
 * - 浜嬪姟绠＄悊
 * - DTO 杞崲锛圖omain 鈫?Contracts锛?
 */
export class RepositoryStatisticsApplicationService {
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
   * 鑾峰彇璐︽埛鐨勭粺璁′俊鎭紙涓嶅瓨鍦ㄥ垯鑷姩鍒涘缓锛?
   */
  async getOrCreateStatistics(
    accountUuid: string,
  ): Promise<RepositoryStatisticsServerDTO> {
    // 濮旀墭缁欓鍩熸湇鍔″鐞?
    const statistics = await this.domainService.getOrCreateStatistics(accountUuid);

    // 杞崲涓?DTO
    return statistics.toClientDTO();
  }

  /**
   * 鑾峰彇璐︽埛鐨勭粺璁′俊鎭紙涓嶈嚜鍔ㄥ垱寤猴級
   */
  async getStatistics(
    accountUuid: string,
  ): Promise<RepositoryStatisticsServerDTO | null> {
    // 濮旀墭缁欓鍩熸湇鍔″鐞?
    const statistics = await this.domainService.getStatistics(accountUuid);

    return statistics ? statistics.toClientDTO() : null;
  }

  /**
   * 鍒濆鍖栫粺璁′俊鎭?
   */
  async initializeStatistics(
    accountUuid: string,
  ): Promise<RepositoryStatisticsServerDTO> {
    // 濮旀墭缁欓鍩熸湇鍔″鐞?
    const statistics = await this.domainService.initializeStatistics(accountUuid);

    // 杞崲涓?DTO
    return statistics.toClientDTO();
  }

  /**
   * 閲嶆柊璁＄畻缁熻淇℃伅
   */
  async recalculateStatistics(
    request: RecalculateStatisticsRequest,
  ): Promise<RecalculateStatisticsResponse> {
    // 濮旀墭缁欓鍩熸湇鍔″鐞嗭紙Response 宸茬粡鏄?DTO 鏍煎紡锛?
    return await this.domainService.recalculateStatistics(request);
  }

  /**
   * 澶勭悊缁熻鏇存柊浜嬩欢
   */
  async handleStatisticsUpdateEvent(
    event: StatisticsUpdateEvent,
  ): Promise<void> {
    // 濮旀墭缁欓鍩熸湇鍔″鐞?
    await this.domainService.handleStatisticsUpdateEvent(event);
  }

  /**
   * 鍒犻櫎缁熻淇℃伅
   */
  async deleteStatistics(accountUuid: string): Promise<void> {
    // 濮旀墭缁欓鍩熸湇鍔″鐞?
    await this.domainService.deleteStatistics(accountUuid);
  }

  /**
   * 鎵归噺鑾峰彇澶氫釜璐︽埛鐨勭粺璁?
   */
  async getStatisticsByAccountUuids(
    accountUuids: string[],
  ): Promise<RepositoryStatisticsServerDTO[]> {
    // 濮旀墭缁欓鍩熸湇鍔″鐞?
    const statisticsList = await this.domainService.getStatisticsByAccountUuids(accountUuids);

    // 杞崲涓?DTO 鏁扮粍
    return statisticsList.map((stats) => stats.toClientDTO());
  }

  /**
   * 鑾峰彇鎵€鏈夎处鎴风殑缁熻锛堝垎椤碉級
   */
  async getAllStatistics(options?: {
    skip?: number;
    take?: number;
  }): Promise<RepositoryStatisticsServerDTO[]> {
    // 濮旀墭缁欓鍩熸湇鍔″鐞?
    const statisticsList = await this.domainService.getAllStatistics(options);

    // 杞崲涓?DTO 鏁扮粍
    return statisticsList.map((stats) => stats.toClientDTO());
  }

  /**
   * 缁熻璐︽埛鎬绘暟
   */
  async countStatistics(): Promise<number> {
    // 濮旀墭缁欓鍩熸湇鍔″鐞?
    return await this.domainService.countStatistics();
  }
}



