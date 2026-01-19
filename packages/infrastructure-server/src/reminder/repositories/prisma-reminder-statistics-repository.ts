import { PrismaClient } from '@prisma/client';
import type { IReminderStatisticsRepository } from '@dailyuse/domain-server/reminder';
import { ReminderStatistics } from '@dailyuse/domain-server/reminder';

/**
 * ReminderStatistics Prisma 仓储实现
 * 统计聚合根，使用 UPSERT 语义（accountUuid 唯一）
 * 每个账户只有一条统计记录
 */
export class PrismaReminderStatisticsRepository implements IReminderStatisticsRepository {
  constructor(private prisma: PrismaClient) {}

  private toDate(timestamp: number): Date {
    return new Date(timestamp);
  }

  private mapToEntity(data: any): ReminderStatistics {
    return ReminderStatistics.fromPersistenceDTO({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      template_stats: data.templateStats,
      group_stats: data.groupStats,
      trigger_stats: data.triggerStats,
      calculated_at: data.calculatedAt.getTime(),
    });
  }

  async save(statistics: ReminderStatistics): Promise<void> {
    const persistence = statistics.toPersistenceDTO();
    const data = {
      uuid: persistence.uuid,
      accountUuid: persistence.accountUuid,
      templateStats: persistence.template_stats,
      groupStats: persistence.group_stats,
      triggerStats: persistence.trigger_stats,
      calculatedAt: this.toDate(persistence.calculated_at),
    };

    await this.prisma.reminderStatistic.upsert({
      where: { accountUuid: persistence.accountUuid },
      create: data,
      update: {
        templateStats: data.templateStats,
        groupStats: data.groupStats,
        triggerStats: data.triggerStats,
        calculatedAt: data.calculatedAt,
      },
    });
  }

  async findOrCreate(accountUuid: string): Promise<ReminderStatistics> {
    const existing = await this.prisma.reminderStatistic.findUnique({
      where: { accountUuid },
    });

    if (existing) {
      return this.mapToEntity(existing);
    }

    const newStats = ReminderStatistics.create({ accountUuid });
    await this.save(newStats);
    return newStats;
  }

  async findByAccountUuid(accountUuid: string): Promise<ReminderStatistics | null> {
    const record = await this.prisma.reminderStatistic.findUnique({
      where: { accountUuid },
    });

    return record ? this.mapToEntity(record) : null;
  }

  async delete(accountUuid: string): Promise<void> {
    await this.prisma.reminderStatistic.delete({
      where: { accountUuid },
    });
  }

  async exists(accountUuid: string): Promise<boolean> {
    const count = await this.prisma.reminderStatistic.count({
      where: { accountUuid },
    });
    return count > 0;
  }
}
