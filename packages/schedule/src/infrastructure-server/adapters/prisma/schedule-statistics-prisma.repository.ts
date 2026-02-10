import type {  PrismaClient  } from "../../../generated/prisma/client";
import type { IScheduleStatisticsRepository } from '@/domain-server';
import { ScheduleStatistics } from '@/domain-server';

/**
 * ScheduleStatistics 鑱氬悎鏍?Prisma Repository瀹炵幇
 * 璐熻矗缁熻鏁版嵁鐨勬寔涔呭寲
 *
 * 鍙傝€?Repository 妯″潡鐨勭粺璁′粨鍌ㄥ疄鐜版ā寮?
 */
export class ScheduleStatisticsPrismaRepository implements IScheduleStatisticsRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 鏁版嵁鏄犲皠鏂规硶 =====

  /**
   * 灏?Prisma 鏁版嵁鏄犲皠涓?ScheduleStatistics 瀹炰綋
   */
  private mapToEntity(data: any): ScheduleStatistics {
    const moduleStats = data.moduleStats || '{}';

    return ScheduleStatistics.fromPersistenceDTO({
      accountUuid: data.accountUuid,
      // 浠诲姟缁熻
      totalTasks: data.totalTasks,
      activeTasks: data.activeTasks,
      pausedTasks: data.pausedTasks,
      completedTasks: data.completedTasks,
      failedTasks: data.failedTasks,
      cancelledTasks: data.cancelledTasks,
      // 鎵ц缁熻
      totalExecutions: data.totalExecutions,
      successfulExecutions: data.successfulExecutions,
      failedExecutions: data.failedExecutions,
      skippedExecutions: data.skippedExecutions,
      timeoutExecutions: data.timeoutExecutions || 0,
      // 鎬ц兘鎸囨爣
      avgExecutionDuration: data.avgExecutionDuration,
      minExecutionDuration: data.minExecutionDuration,
      maxExecutionDuration: data.maxExecutionDuration,
      // 妯″潡缁熻锛圝SON string锛?
      moduleStatistics: moduleStats,
      // 鏃堕棿鎴?
      lastUpdatedAt: data.lastUpdatedAt?.getTime() || Date.now(),
      createdAt: data.createdAt?.getTime() || Date.now(),
    });
  }

  /**
   * 灏嗛鍩熷疄浣撹浆鎹负 Prisma 鏁版嵁
   */
  private mapToPrisma(stats: ScheduleStatistics): any {
    const dto = stats.toPersistenceDTO();

    return {
      accountUuid: dto.accountUuid,
      // 浠诲姟缁熻锛圥ersistenceDTO 浣跨敤 camelCase锛?
      totalTasks: dto.totalTasks,
      activeTasks: dto.activeTasks,
      pausedTasks: dto.pausedTasks,
      completedTasks: dto.completedTasks,
      failedTasks: dto.failedTasks,
      cancelledTasks: dto.cancelledTasks,
      // 鎵ц缁熻
      totalExecutions: dto.totalExecutions,
      successfulExecutions: dto.successfulExecutions,
      failedExecutions: dto.failedExecutions,
      skippedExecutions: dto.skippedExecutions,
      timeoutExecutions: dto.timeoutExecutions,
      // 鎬ц兘鎸囨爣
      avgExecutionDuration: dto.avgExecutionDuration,
      minExecutionDuration: dto.minExecutionDuration,
      maxExecutionDuration: dto.maxExecutionDuration,
      // 鏃堕棿鎴?
      lastUpdatedAt: new Date(dto.lastUpdatedAt),
      createdAt: new Date(dto.createdAt),
      // 妯″潡缁熻锛圝SON string锛?
      moduleStatistics: dto.moduleStatistics,
    };
  }

  // ===== Repository鏂规硶 =====

  /**
   * Save鎴栨洿鏂扮粺Count鎹紙UPSERT锛?
   */
  async save(stats: ScheduleStatistics): Promise<void> {
    const data = this.mapToPrisma(stats);

    await this.prisma.scheduleStatistic.upsert({
      where: { accountUuid: data.accountUuid },
      create: data,
      update: data,
    });
  }

  /**
   * 鏍规嵁璐︽埛UUID鏌ユ壘缁熻鏁版嵁
   */
  async findByAccountUuid(accountUuid: string): Promise<ScheduleStatistics | null> {
    const data = await this.prisma.scheduleStatistic.findUnique({
      where: { accountUuid },
    });

    return data ? this.mapToEntity(data) : null;
  }

  /**
   * Get鎴栧垱寤虹粺Count鎹?
   * 濡傛灉涓嶅瓨鍦ㄥ垯Create涓€涓垵濮嬪寲鐨勭粺璁″璞?
   */
  async getOrCreate(accountUuid: string): Promise<ScheduleStatistics> {
    let stats = await this.findByAccountUuid(accountUuid);

    if (!stats) {
      // Create鍒濆鍖栫殑缁熻鏁版嵁
      stats = ScheduleStatistics.createEmpty(accountUuid);
      await this.save(stats);
    }

    return stats;
  }

  /**
   * Delete缁熻鏁版嵁锛堟帴鍙ｈ姹傜殑鏂规硶鍚嶏級
   */
  async deleteByAccountUuid(accountUuid: string): Promise<void> {
    await this.prisma.scheduleStatistic.delete({
      where: { accountUuid },
    });
  }

  /**
   * 鏌ヨAll鏈夌粺Count鎹?
   */
  async findAll(limit?: number, offset?: number): Promise<ScheduleStatistics[]> {
    const data = await this.prisma.scheduleStatistic.findMany({
      take: limit,
      skip: offset,
      orderBy: { lastUpdatedAt: 'desc' },
    });

    return data.map((d) => this.mapToEntity(d));
  }

  /**
   * 鎵归噺Save
   */
  async saveBatch(statistics: ScheduleStatistics[]): Promise<void> {
    for (const stats of statistics) {
      await this.save(stats);
    }
  }

  /**
   * 閲嶇疆缁熻鏁版嵁
   */
  async reset(accountUuid: string): Promise<void> {
    const stats = ScheduleStatistics.createEmpty(accountUuid);
    await this.save(stats);
  }

  /**
   * 浜嬪姟鏀寔
   */
  async withTransaction<T>(fn: (repo: IScheduleStatisticsRepository) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const txRepo = new ScheduleStatisticsPrismaRepository(tx as PrismaClient);
      return fn(txRepo);
    });
  }
}

