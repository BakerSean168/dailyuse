import { PrismaClient } from '@prisma/client';
import type { ITaskStatisticsRepository } from '@dailyuse/domain-server/task';
import { TaskStatistics } from '@dailyuse/domain-server/task';

/**
 * TaskStatistics Prisma 仓储实现
 * 负责 TaskStatistics 聚合根的持久化操作
 */
export class PrismaTaskStatisticsRepository implements ITaskStatisticsRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 将数据库记录映射为领域实体
   */
  private mapToEntity(data: any): TaskStatistics {
    return TaskStatistics.fromPersistenceDTO({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      // Flattened template_stats
      templateTotal: data.templateTotal,
      templateActive: data.templateActive,
      templatePaused: data.templatePaused,
      templateArchived: data.templateArchived,
      templateOneTime: data.templateOneTime,
      templateRecurring: data.templateRecurring,
      // Flattened instance_stats
      instanceTotal: data.instanceTotal,
      instanceToday: data.instanceToday,
      instanceWeek: data.instanceWeek,
      instanceMonth: data.instanceMonth,
      instancePending: data.instancePending,
      instanceInProgress: data.instanceInProgress,
      instanceCompleted: data.instanceCompleted,
      instanceSkipped: data.instanceSkipped,
      instanceExpired: data.instanceExpired,
      // Flattened completion_stats
      completionToday: data.completionToday,
      completionWeek: data.completionWeek,
      completionMonth: data.completionMonth,
      completionTotal: data.completionTotal,
      completionAvgTime: data.completionAvgTime,
      completionRate: data.completionRate,
      // Flattened time_stats
      timeAllDay: data.timeAllDay,
      timePoint: data.timePoint,
      timeRange: data.timeRange,
      timeOverdue: data.timeOverdue,
      timeUpcoming: data.timeUpcoming,
      // JSON fields for distribution_stats
      distributionByImportance: data.distributionByImportance,
      distributionByUrgency: data.distributionByUrgency,
      distributionByFolder: data.distributionByFolder,
      distributionByTag: data.distributionByTag,
      calculatedAt: data.calculatedAt.getTime(),
    });
  }

  /**
   * 将时间戳转换为 Date 对象
   */
  private toDate(timestamp: number | null | undefined): Date | null | undefined {
    if (timestamp == null) return timestamp as null | undefined;
    return new Date(timestamp);
  }

  /**
   * 保存或更新统计数据
   */
  async save(statistics: TaskStatistics): Promise<void> {
    const persistence = statistics.toPersistenceDTO();

    await this.prisma.taskStatistic.upsert({
      where: { uuid: persistence.uuid },
      create: {
        uuid: persistence.uuid,
        accountUuid: persistence.accountUuid,
        // Flattened template_stats
        templateTotal: persistence.templateTotal,
        templateActive: persistence.templateActive,
        templatePaused: persistence.templatePaused,
        templateArchived: persistence.templateArchived,
        templateOneTime: persistence.templateOneTime,
        templateRecurring: persistence.templateRecurring,
        // Flattened instance_stats
        instanceTotal: persistence.instanceTotal,
        instanceToday: persistence.instanceToday,
        instanceWeek: persistence.instanceWeek,
        instanceMonth: persistence.instanceMonth,
        instancePending: persistence.instancePending,
        instanceInProgress: persistence.instanceInProgress,
        instanceCompleted: persistence.instanceCompleted,
        instanceSkipped: persistence.instanceSkipped,
        instanceExpired: persistence.instanceExpired,
        // Flattened completion_stats
        completionToday: persistence.completionToday,
        completionWeek: persistence.completionWeek,
        completionMonth: persistence.completionMonth,
        completionTotal: persistence.completionTotal,
        completionAvgTime: persistence.completionAvgTime,
        completionRate: persistence.completionRate,
        // Flattened time_stats
        timeAllDay: persistence.timeAllDay,
        timePoint: persistence.timePoint,
        timeRange: persistence.timeRange,
        timeOverdue: persistence.timeOverdue,
        timeUpcoming: persistence.timeUpcoming,
        // JSON fields for distribution_stats
        distributionByImportance: persistence.distributionByImportance,
        distributionByUrgency: persistence.distributionByUrgency,
        distributionByFolder: persistence.distributionByFolder,
        distributionByTag: persistence.distributionByTag,
        calculatedAt: this.toDate(persistence.calculatedAt)!,
      },
      update: {
        // Flattened template_stats
        templateTotal: persistence.templateTotal,
        templateActive: persistence.templateActive,
        templatePaused: persistence.templatePaused,
        templateArchived: persistence.templateArchived,
        templateOneTime: persistence.templateOneTime,
        templateRecurring: persistence.templateRecurring,
        // Flattened instance_stats
        instanceTotal: persistence.instanceTotal,
        instanceToday: persistence.instanceToday,
        instanceWeek: persistence.instanceWeek,
        instanceMonth: persistence.instanceMonth,
        instancePending: persistence.instancePending,
        instanceInProgress: persistence.instanceInProgress,
        instanceCompleted: persistence.instanceCompleted,
        instanceSkipped: persistence.instanceSkipped,
        instanceExpired: persistence.instanceExpired,
        // Flattened completion_stats
        completionToday: persistence.completionToday,
        completionWeek: persistence.completionWeek,
        completionMonth: persistence.completionMonth,
        completionTotal: persistence.completionTotal,
        completionAvgTime: persistence.completionAvgTime,
        completionRate: persistence.completionRate,
        // Flattened time_stats
        timeAllDay: persistence.timeAllDay,
        timePoint: persistence.timePoint,
        timeRange: persistence.timeRange,
        timeOverdue: persistence.timeOverdue,
        timeUpcoming: persistence.timeUpcoming,
        // JSON fields for distribution_stats
        distributionByImportance: persistence.distributionByImportance,
        distributionByUrgency: persistence.distributionByUrgency,
        distributionByFolder: persistence.distributionByFolder,
        distributionByTag: persistence.distributionByTag,
        calculatedAt: this.toDate(persistence.calculatedAt)!,
      },
    });
  }

  /**
   * 根据 UUID 查找统计数据
   */
  async findByUuid(uuid: string): Promise<TaskStatistics | null> {
    const data = await this.prisma.taskStatistic.findUnique({
      where: { uuid },
    });

    return data ? this.mapToEntity(data) : null;
  }

  /**
   * 根据账户 UUID 查找统计数据
   */
  async findByAccountUuid(accountUuid: string): Promise<TaskStatistics | null> {
    const data = await this.prisma.taskStatistic.findUnique({
      where: { accountUuid },
    });

    return data ? this.mapToEntity(data) : null;
  }

  /**
   * 删除统计数据
   */
  async delete(uuid: string): Promise<void> {
    await this.prisma.taskStatistic.delete({
      where: { uuid },
    });
  }

  /**
   * 批量保存统计数据
   */
  async saveBatch(statisticsList: TaskStatistics[]): Promise<void> {
    await this.prisma.$transaction(
      statisticsList.map((stats) => {
        const persistence = stats.toPersistenceDTO();
        return this.prisma.taskStatistic.upsert({
          where: { uuid: persistence.uuid },
          create: {
            uuid: persistence.uuid,
            accountUuid: persistence.accountUuid,
            templateTotal: persistence.templateTotal,
            templateActive: persistence.templateActive,
            templatePaused: persistence.templatePaused,
            templateArchived: persistence.templateArchived,
            templateOneTime: persistence.templateOneTime,
            templateRecurring: persistence.templateRecurring,
            instanceTotal: persistence.instanceTotal,
            instanceToday: persistence.instanceToday,
            instanceWeek: persistence.instanceWeek,
            instanceMonth: persistence.instanceMonth,
            instancePending: persistence.instancePending,
            instanceInProgress: persistence.instanceInProgress,
            instanceCompleted: persistence.instanceCompleted,
            instanceSkipped: persistence.instanceSkipped,
            instanceExpired: persistence.instanceExpired,
            completionToday: persistence.completionToday,
            completionWeek: persistence.completionWeek,
            completionMonth: persistence.completionMonth,
            completionTotal: persistence.completionTotal,
            completionAvgTime: persistence.completionAvgTime,
            completionRate: persistence.completionRate,
            timeAllDay: persistence.timeAllDay,
            timePoint: persistence.timePoint,
            timeRange: persistence.timeRange,
            timeOverdue: persistence.timeOverdue,
            timeUpcoming: persistence.timeUpcoming,
            distributionByImportance: persistence.distributionByImportance,
            distributionByUrgency: persistence.distributionByUrgency,
            distributionByFolder: persistence.distributionByFolder,
            distributionByTag: persistence.distributionByTag,
            calculatedAt: this.toDate(persistence.calculatedAt)!,
          },
          update: {
            templateTotal: persistence.templateTotal,
            templateActive: persistence.templateActive,
            templatePaused: persistence.templatePaused,
            templateArchived: persistence.templateArchived,
            templateOneTime: persistence.templateOneTime,
            templateRecurring: persistence.templateRecurring,
            instanceTotal: persistence.instanceTotal,
            instanceToday: persistence.instanceToday,
            instanceWeek: persistence.instanceWeek,
            instanceMonth: persistence.instanceMonth,
            instancePending: persistence.instancePending,
            instanceInProgress: persistence.instanceInProgress,
            instanceCompleted: persistence.instanceCompleted,
            instanceSkipped: persistence.instanceSkipped,
            instanceExpired: persistence.instanceExpired,
            completionToday: persistence.completionToday,
            completionWeek: persistence.completionWeek,
            completionMonth: persistence.completionMonth,
            completionTotal: persistence.completionTotal,
            completionAvgTime: persistence.completionAvgTime,
            completionRate: persistence.completionRate,
            timeAllDay: persistence.timeAllDay,
            timePoint: persistence.timePoint,
            timeRange: persistence.timeRange,
            timeOverdue: persistence.timeOverdue,
            timeUpcoming: persistence.timeUpcoming,
            distributionByImportance: persistence.distributionByImportance,
            distributionByUrgency: persistence.distributionByUrgency,
            distributionByFolder: persistence.distributionByFolder,
            distributionByTag: persistence.distributionByTag,
            calculatedAt: this.toDate(persistence.calculatedAt)!,
          },
        });
      }),
    );
  }
}
