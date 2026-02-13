import type {  PrismaClient  } from '@dailyuse/database';
import type { IScheduleStatisticsRepository } from '../../../domain-server/repositories/IScheduleStatisticsRepository';
import { ScheduleStatistics } from '../../../domain-server/aggregates/schedule-statistics';

/**
 * ScheduleStatistics 閼辨艾鎮庨弽?Prisma Repository鐎圭偟骞?
 * 鐠愮喕鐭楃紒鐔活吀閺佺増宓侀惃鍕瘮娑斿懎瀵?
 *
 * 閸欏倽鈧?Repository 濡€虫健閻ㄥ嫮绮虹拋鈥茬波閸屻劌鐤勯悳鐗埬佸?
 */
export class ScheduleStatisticsPrismaRepository implements IScheduleStatisticsRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 閺佺増宓侀弰鐘茬殸閺傝纭?=====

  /**
   * 鐏?Prisma 閺佺増宓侀弰鐘茬殸娑?ScheduleStatistics 鐎圭偘缍?
   */
  private mapToEntity(data: any): ScheduleStatistics {
    const moduleStats = data.moduleStats || '{}';

    return ScheduleStatistics.fromPersistenceDTO({
      identityId: data.identityId,
      // 娴犺濮熺紒鐔活吀
      totalTasks: data.totalTasks,
      activeTasks: data.activeTasks,
      pausedTasks: data.pausedTasks,
      completedTasks: data.completedTasks,
      failedTasks: data.failedTasks,
      cancelledTasks: data.cancelledTasks,
      // 閹笛嗩攽缂佺喕顓?
      totalExecutions: data.totalExecutions,
      successfulExecutions: data.successfulExecutions,
      failedExecutions: data.failedExecutions,
      skippedExecutions: data.skippedExecutions,
      timeoutExecutions: data.timeoutExecutions || 0,
      // 閹嗗厴閹稿洦鐖?
      avgExecutionDuration: data.avgExecutionDuration,
      minExecutionDuration: data.minExecutionDuration,
      maxExecutionDuration: data.maxExecutionDuration,
      // 濡€虫健缂佺喕顓搁敍鍦漇ON string閿?
      moduleStatistics: moduleStats,
      // 閺冨爼妫块幋?
      lastUpdatedAt: data.lastUpdatedAt?.getTime() || Date.now(),
      createdAt: data.createdAt?.getTime() || Date.now(),
    });
  }

  /**
   * 鐏忓棝顣崺鐔风杽娴ｆ捁娴嗛幑顫礋 Prisma 閺佺増宓?
   */
  private mapToPrisma(stats: ScheduleStatistics): any {
    const dto = stats.toPersistenceDTO();

    return {
      identityId: dto.identityId,
      // 娴犺濮熺紒鐔活吀閿涘湧ersistenceDTO 娴ｈ法鏁?camelCase閿?
      totalTasks: dto.totalTasks,
      activeTasks: dto.activeTasks,
      pausedTasks: dto.pausedTasks,
      completedTasks: dto.completedTasks,
      failedTasks: dto.failedTasks,
      cancelledTasks: dto.cancelledTasks,
      // 閹笛嗩攽缂佺喕顓?
      totalExecutions: dto.totalExecutions,
      successfulExecutions: dto.successfulExecutions,
      failedExecutions: dto.failedExecutions,
      skippedExecutions: dto.skippedExecutions,
      timeoutExecutions: dto.timeoutExecutions,
      // 閹嗗厴閹稿洦鐖?
      avgExecutionDuration: dto.avgExecutionDuration,
      minExecutionDuration: dto.minExecutionDuration,
      maxExecutionDuration: dto.maxExecutionDuration,
      // 閺冨爼妫块幋?
      lastUpdatedAt: new Date(dto.lastUpdatedAt),
      createdAt: new Date(dto.createdAt),
      // 濡€虫健缂佺喕顓搁敍鍦漇ON string閿?
      moduleStatistics: dto.moduleStatistics,
    };
  }

  // ===== Repository閺傝纭?=====

  /**
   * Save閹存牗娲块弬鎵埠Count閹诡噯绱橴PSERT閿?
   */
  async save(stats: ScheduleStatistics): Promise<void> {
    const data = this.mapToPrisma(stats);

    await this.prisma.scheduleStatistic.upsert({
      where: { identityId: data.identityId },
      create: data,
      update: data,
    });
  }

  /**
   * 閺嶈宓佺拹锔藉煕UUID閺屻儲澹樼紒鐔活吀閺佺増宓?
   */
  async findByIdentityId(identityId: string): Promise<ScheduleStatistics | null> {
    const data = await this.prisma.scheduleStatistic.findUnique({
      where: { identityId },
    });

    return data ? this.mapToEntity(data) : null;
  }

  /**
   * Get閹存牕鍨卞铏圭埠Count閹?
   * 婵″倹鐏夋稉宥呯摠閸︺劌鍨疌reate娑撯偓娑擃亜鍨垫慨瀣閻ㄥ嫮绮虹拋鈥愁嚠鐠?
   */
  async getOrCreate(identityId: string): Promise<ScheduleStatistics> {
    let stats = await this.findByIdentityId(identityId);

    if (!stats) {
      // Create閸掓繂顫愰崠鏍畱缂佺喕顓搁弫鐗堝祦
      stats = ScheduleStatistics.createEmpty(identityId);
      await this.save(stats);
    }

    return stats;
  }

  /**
   * Delete缂佺喕顓搁弫鐗堝祦閿涘牊甯撮崣锝堫洣濮瑰倻娈戦弬瑙勭《閸氬稄绱?
   */
  async deleteByIdentityId(identityId: string): Promise<void> {
    await this.prisma.scheduleStatistic.delete({
      where: { identityId },
    });
  }

  /**
   * 閺屻儴顕桝ll閺堝绮篊ount閹?
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
   * 閹靛綊鍣篠ave
   */
  async saveBatch(statistics: ScheduleStatistics[]): Promise<void> {
    for (const stats of statistics) {
      await this.save(stats);
    }
  }

  /**
   * 闁插秶鐤嗙紒鐔活吀閺佺増宓?
   */
  async reset(identityId: string): Promise<void> {
    const stats = ScheduleStatistics.createEmpty(identityId);
    await this.save(stats);
  }

  /**
   * 娴滃濮熼弨顖涘瘮
   */
  async withTransaction<T>(fn: (repo: IScheduleStatisticsRepository) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const txRepo = new ScheduleStatisticsPrismaRepository(tx as PrismaClient);
      return fn(txRepo);
    });
  }
}

