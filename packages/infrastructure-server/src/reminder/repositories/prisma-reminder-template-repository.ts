// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import type { IReminderTemplateRepository } from '@dailyuse/domain-server/reminder';
import { ReminderTemplate, ReminderHistory } from '@dailyuse/domain-server/reminder';
import { ReminderTemplateStatus } from '@dailyuse/contracts/reminder';
import type { ReminderTemplateServerDTO, ReminderGroupServerDTO, CreateReminderTemplateRequest } from '@dailyuse/contracts/reminder';

/**
 * ReminderTemplate 聚合根 Prisma 仓储实现
 * 负责 ReminderTemplate 及其所有子实体的完整持久化
 *
 * 聚合根包含：
 * - ReminderTemplate (主实体)
 * - ReminderHistory[] (子实体集合)
 * - 值对象：trigger, recurrence, active_time, active_hours, notification_config, stats (JSON存储)
 */
export class PrismaReminderTemplateRepository implements IReminderTemplateRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToEntity(data: any, includeHistory: boolean = false): ReminderTemplate {
    const template = ReminderTemplate.fromPersistenceDTO({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      title: data.title,
      description: data.description,
      type: data.type,
      trigger: data.trigger,
      recurrence: data.recurrence,
      activeTime: data.activeTime, // database field: active_time
      activeHours: data.activeHours, // database field: active_hours
      notificationConfig: data.notificationConfig, // database field: notification_config
      selfEnabled: data.selfEnabled, // database field: self_enabled
      status: data.status,
      groupUuid: data.groupUuid,
      importanceLevel: data.importanceLevel, // database field: importance_level
      tags: data.tags,
      color: data.color,
      icon: data.icon,
      nextTriggerAt: data.nextTriggerAt ? Number(data.nextTriggerAt) : null, // database field: next_trigger_at
      stats: data.stats,
      
      // Smart Frequency fields
      responseMetrics: data.responseMetrics || null,
      frequencyAdjustment: data.frequencyAdjustment || null,
      smartFrequencyEnabled: data.smartFrequencyEnabled ?? true,
      
      createdAt: Number(data.createdAt),
      updatedAt: Number(data.updatedAt),
      deletedAt: data.deletedAt ? Number(data.deletedAt) : null,
    });

    if (includeHistory && data.history) {
      data.history.forEach((hist: any) => {
        template.addHistory(
          ReminderHistory.fromPersistenceDTO({
            uuid: hist.uuid,
            templateUuid: hist.templateUuid,
            triggeredAt: Number(hist.triggeredAt), // database field mapped from triggered_at
            result: hist.result,
            error: hist.error,
            notificationSent: hist.notificationSent,
            notificationChannels: hist.notificationChannel,
            createdAt: Number(hist.createdAt),
          }),
        );
      });
    }
    return template;
  }

  async save(template: ReminderTemplate): Promise<void> {
    const persistence = template.toPersistenceDTO();
    
    // 数据对象直接对应 Prisma Schema（无需JSON解析和字段拆分）
    const data = {
      uuid: persistence.uuid,
      accountUuid: persistence.accountUuid,
      title: persistence.title,
      description: persistence.description,
      type: persistence.type,
      trigger: persistence.trigger,
      recurrence: persistence.recurrence,
      activeTime: persistence.activeTime,
      activeHours: persistence.activeHours,
      notificationConfig: persistence.notificationConfig,
      selfEnabled: persistence.selfEnabled,
      status: persistence.status,
      groupUuid: persistence.groupUuid,
      importanceLevel: persistence.importanceLevel,
      tags: persistence.tags,
      color: persistence.color,
      icon: persistence.icon,
      nextTriggerAt: persistence.nextTriggerAt ? new Date(persistence.nextTriggerAt) : null,
      stats: persistence.stats,
      
      // Smart Frequency: Response Metrics（扁平化字段，直接来自 persistence DTO）
      clickRate: persistence.clickRate ?? null,
      ignoreRate: persistence.ignoreRate ?? null,
      avgResponseTime: persistence.avgResponseTime ?? null,
      snoozeCount: persistence.snoozeCount ?? 0,
      effectivenessScore: persistence.effectivenessScore ?? null,
      sampleSize: persistence.sampleSize ?? 0,
      lastAnalysisTime: persistence.lastAnalysisTime ?? null,
      
      // Smart Frequency: Frequency Adjustment（扁平化字段，直接来自 persistence DTO）
      originalInterval: persistence.originalInterval ?? null,
      adjustedInterval: persistence.adjustedInterval ?? null,
      adjustmentReason: persistence.adjustmentReason ?? null,
      adjustmentTime: persistence.adjustmentTime ?? null,
      isAutoAdjusted: persistence.isAutoAdjusted ?? false,
      userConfirmed: persistence.userConfirmed ?? false,
      
      smartFrequencyEnabled: persistence.smartFrequencyEnabled ?? true,
      
      createdAt: new Date(persistence.createdAt),
      updatedAt: new Date(persistence.updatedAt),
      deletedAt: persistence.deletedAt ? new Date(persistence.deletedAt) : null,
    };

    const historyData =
      template.history?.map((h) => {
        const histPersistence = h.toPersistenceDTO();
        return {
          uuid: histPersistence.uuid,
          templateUuid: histPersistence.templateUuid,
          triggeredAt: new Date(histPersistence.triggeredAt),
          result: histPersistence.result,
          error: histPersistence.error,
          notificationSent: histPersistence.notificationSent,
          notificationChannel: histPersistence.notificationChannels,
          createdAt: new Date(histPersistence.createdAt),
        };
      }) ?? [];

    await this.prisma.$transaction(async (tx) => {
      await tx.reminderTemplate.upsert({
        where: { uuid: data.uuid },
        create: data,
        update: {
          ...data,
          uuid: undefined,
          accountUuid: undefined,
          createdAt: undefined,
        },
      });

      if (historyData.length > 0) {
        await tx.reminderHistory.createMany({
          data: historyData,
          skipDuplicates: true,
        });
      }
    });
  }

  async findByUuid(
    uuid: string,
    options?: { includeHistory?: boolean },
  ): Promise<ReminderTemplate | null> {
    const data = await this.prisma.reminderTemplate.findUnique({
      where: { uuid },
      include: { reminderHistory: options?.includeHistory ?? false },
    });
    return data ? this.mapToEntity(data, options?.includeHistory) : null;
  }

  // 别名方法，与接口保持一致
  async findById(
    uuid: string,
    options?: { includeHistory?: boolean },
  ): Promise<ReminderTemplate | null> {
    return this.findByUuid(uuid, options);
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: { includeHistory?: boolean; includeDeleted?: boolean },
  ): Promise<ReminderTemplate[]> {
    const data = await this.prisma.reminderTemplate.findMany({
      where: {
        accountUuid: accountUuid,
        deletedAt: options?.includeDeleted ? undefined : null,
      },
      include: { reminderHistory: options?.includeHistory ?? false },
    });
    return data.map((d) => this.mapToEntity(d, options?.includeHistory));
  }

  async findByGroupUuid(
    groupUuid: string | null,
    options?: { includeHistory?: boolean; includeDeleted?: boolean },
  ): Promise<ReminderTemplate[]> {
    const data = await this.prisma.reminderTemplate.findMany({
      where: {
        groupUuid: groupUuid,
        deletedAt: options?.includeDeleted ? undefined : null,
      },
      include: { reminderHistory: options?.includeHistory ?? false },
    });
    return data.map((d) => this.mapToEntity(d, options?.includeHistory));
  }

  async findActive(accountUuid?: string): Promise<ReminderTemplate[]> {
    const data = await this.prisma.reminderTemplate.findMany({
      where: {
        accountUuid: accountUuid,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
    return data.map((d) => this.mapToEntity(d));
  }

  async findByNextTriggerBefore(
    beforeTime: number,
    accountUuid?: string,
  ): Promise<ReminderTemplate[]> {
    const data = await this.prisma.reminderTemplate.findMany({
      where: {
        accountUuid: accountUuid,
        status: 'ACTIVE',
        deletedAt: null,
        nextTriggerAt: { lte: new Date(beforeTime) }, // database field: next_trigger_at
      },
    });
    return data.map((d) => this.mapToEntity(d));
  }

  async findByIds(
    uuids: string[],
    options?: { includeHistory?: boolean },
  ): Promise<ReminderTemplate[]> {
    const data = await this.prisma.reminderTemplate.findMany({
      where: { uuid: { in: uuids } },
      include: { reminderHistory: options?.includeHistory ?? false },
    });
    return data.map((d) => this.mapToEntity(d, options?.includeHistory));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.reminderHistory.deleteMany({ where: { templateUuid: uuid } });
    await this.prisma.reminderTemplate.delete({ where: { uuid } });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.reminderTemplate.count({ where: { uuid } });
    return count > 0;
  }

  async count(
    accountUuid: string,
    options?: { status?: ReminderStatus; includeDeleted?: boolean },
  ): Promise<number> {
    return this.prisma.reminderTemplate.count({
      where: {
        accountUuid: accountUuid,
        status: options?.status,
        deletedAt: options?.includeDeleted ? undefined : null,
      },
    });
  }
}

