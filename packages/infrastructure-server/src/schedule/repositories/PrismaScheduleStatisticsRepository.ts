import { PrismaClient } from '@prisma/client';
import type { IScheduleStatisticsRepository } from '@dailyuse/domain-server/schedule';
import { ScheduleStatistics } from '@dailyuse/domain-server/schedule';

/**
 * ScheduleStatistics 聚合根 Prisma 仓储实现
 * 负责统计数据的持久化
 *
 * 参考 Repository 模块的统计仓储实现模式
 */
export class PrismaScheduleStatisticsRepository implements IScheduleStatisticsRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据映射方法 =====

  /**
   * 将 Prisma 数据映射为 ScheduleStatistics 实体
   */
  private mapToEntity(data: any): ScheduleStatistics {
    const moduleStats = data.moduleStats || '{}';

    return ScheduleStatistics.fromPersistenceDTO({
      accountUuid: data.accountUuid,
      // 任务统计
      totalTasks: data.totalTasks,
      activeTasks: data.activeTasks,
      pausedTasks: data.pausedTasks,
      completedTasks: data.completedTasks,
      failedTasks: data.failedTasks,
      cancelledTasks: data.cancelledTasks,
      // 执行统计
      totalExecutions: data.totalExecutions,
      successfulExecutions: data.successfulExecutions,
      failedExecutions: data.failedExecutions,
      skippedExecutions: data.skippedExecutions,
      timeoutExecutions: data.timeoutExecutions || 0,
      // 性能指标
      avgExecutionDuration: data.avgExecutionDuration,
      minExecutionDuration: data.minExecutionDuration,
      maxExecutionDuration: data.maxExecutionDuration,
      // 模块统计（JSON string）
      moduleStatistics: moduleStats,
      // 时间戳
      lastUpdatedAt: data.lastUpdatedAt?.getTime() || Date.now(),
      createdAt: data.createdAt?.getTime() || Date.now(),
    });
  }

  /**
   * 将领域实体转换为 Prisma 数据
   */
  private mapToPrisma(stats: ScheduleStatistics): any {
    const dto = stats.toPersistenceDTO();

    return {
      accountUuid: dto.accountUuid,
      // 任务统计（PersistenceDTO 使用 camelCase）
      totalTasks: dto.totalTasks,
      activeTasks: dto.activeTasks,
      pausedTasks: dto.pausedTasks,
      completedTasks: dto.completedTasks,
      failedTasks: dto.failedTasks,
      cancelledTasks: dto.cancelledTasks,
      // 执行统计
      totalExecutions: dto.totalExecutions,
      successfulExecutions: dto.successfulExecutions,
      failedExecutions: dto.failedExecutions,
      skippedExecutions: dto.skippedExecutions,
      timeoutExecutions: dto.timeoutExecutions,
      // 性能指标
      avgExecutionDuration: dto.avgExecutionDuration,
      minExecutionDuration: dto.minExecutionDuration,
      maxExecutionDuration: dto.maxExecutionDuration,
      // 时间戳
      lastUpdatedAt: new Date(dto.lastUpdatedAt),
      createdAt: new Date(dto.createdAt),
      // 模块统计（JSON string）
      moduleStatistics: dto.moduleStatistics,
    };
  }

  // ===== 仓储方法 =====

  /**
   * 保存或更新统计数据（UPSERT）
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
   * 根据账户UUID查找统计数据
   */
  async findByAccountUuid(accountUuid: string): Promise<ScheduleStatistics | null> {
    const data = await this.prisma.scheduleStatistic.findUnique({
      where: { accountUuid },
    });

    return data ? this.mapToEntity(data) : null;
  }

  /**
   * 获取或创建统计数据
   * 如果不存在则创建一个初始化的统计对象
   */
  async getOrCreate(accountUuid: string): Promise<ScheduleStatistics> {
    let stats = await this.findByAccountUuid(accountUuid);

    if (!stats) {
      // 创建初始化的统计数据
      stats = ScheduleStatistics.createEmpty(accountUuid);
      await this.save(stats);
    }

    return stats;
  }

  /**
   * 删除统计数据（接口要求的方法名）
   */
  async deleteByAccountUuid(accountUuid: string): Promise<void> {
    await this.prisma.scheduleStatistic.delete({
      where: { accountUuid },
    });
  }

  /**
   * 查询所有统计数据
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
   * 批量保存
   */
  async saveBatch(statistics: ScheduleStatistics[]): Promise<void> {
    for (const stats of statistics) {
      await this.save(stats);
    }
  }

  /**
   * 重置统计数据
   */
  async reset(accountUuid: string): Promise<void> {
    const stats = ScheduleStatistics.createEmpty(accountUuid);
    await this.save(stats);
  }

  /**
   * 事务支持
   */
  async withTransaction<T>(fn: (repo: IScheduleStatisticsRepository) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const txRepo = new PrismaScheduleStatisticsRepository(tx as PrismaClient);
      return fn(txRepo);
    });
  }
}
