/**
 * ReminderTemplatePrismaRepository - Prisma Implementation of IReminderTemplateRepository
 * 鎻愰啋妯℃澘浠撳偍 - Prisma 瀹炵幇
 *
 * 鑱氬悎鏍癸細ReminderTemplate
 * 瀛愬疄浣擄細ReminderHistory
 * 
 * Extends AggregateRepositoryBase to automatically publish domain events after persistence.
 */

import type { PrismaClient, ReminderTemplate as PrismaReminderTemplate, ReminderHistory as PrismaReminderHistory, Prisma } from '@dailyuse/database';
import type { IReminderTemplateRepository } from '../../../domain-server/repositories/IReminderTemplateRepository';
import type { ReminderStatus } from '@dailyuse/contracts/reminder';
import { ReminderTemplate } from '../../../domain-server/aggregates/reminder-template';
import { ReminderHistory } from '../../../domain-server/entities/reminder-history';
import { AggregateRepositoryBase, type IEventBus } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils';

type PrismaReminderTemplateWithHistory = PrismaReminderTemplate & {
  history?: PrismaReminderHistory[];
};

/**
 * 全局 EventBus 适配器
 */
const eventBusAdapter: IEventBus = {
  async publish(event) {
    eventBus.send(event.eventType as any, event.payload);
  },
  async send(eventType, payload) {
    eventBus.send(eventType as any, payload);
  },
};

export class ReminderTemplatePrismaRepository
  extends AggregateRepositoryBase<ReminderTemplate>
  implements IReminderTemplateRepository
{
  constructor(private readonly prisma: PrismaClient) {
    super(eventBusAdapter);
  }

  /**
   * Prisma record 鈫?ReminderTemplate 鑱氬悎鏍?
   */
  private mapToEntity(data: PrismaReminderTemplate, historyRecords?: PrismaReminderHistory[]): ReminderTemplate {
    const template = ReminderTemplate.fromPersistenceDTO({
      id: data.id,
      identityId: data.identityId,
      name: data.name,
      description: data.description ?? null,
      type: data.type,
      trigger: data.trigger,
      recurrence: data.recurrence ?? null,
      activeTime: data.activeTime,
      activeHours: data.activeHours ?? null,
      notificationConfig: data.notificationConfig,
      selfEnabled: data.selfEnabled,
      status: data.status,
      groupId: data.reminderGroupId ?? null,
      importanceLevel: data.importanceLevel,
      tags: data.tags,
      color: data.color ?? null,
      icon: data.icon ?? null,
      nextTriggerAt: data.nextTriggerAt ?? null,
      stats: data.stats,

      // Smart Frequency: Response Metrics
      clickRate: data.clickRate ?? null,
      ignoreRate: data.ignoreRate ?? null,
      avgResponseTime: data.avgResponseTime ?? null,
      snoozeCount: data.snoozeCount ?? 0,
      effectivenessScore: data.effectivenessScore ?? null,
      sampleSize: data.sampleSize ?? 0,
      lastAnalysisTime: data.lastAnalysisTime ?? null,

      // Smart Frequency: Frequency Adjustment
      originalInterval: data.originalInterval ?? null,
      adjustedInterval: data.adjustedInterval ?? null,
      adjustmentReason: data.adjustmentReason ?? null,
      adjustmentTime: data.adjustmentTime ?? null,
      isAutoAdjusted: data.isAutoAdjusted ?? false,
      userConfirmed: data.userConfirmed ?? false,
      smartFrequencyEnabled: data.smartFrequencyEnabled ?? true,

      version: data.version,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? null,
    });

    // 鍔犺浇瀛愬疄浣?- 鍘嗗彶璁板綍
    if (historyRecords && historyRecords.length > 0) {
      for (const h of historyRecords) {
        const history = ReminderHistory.fromPersistenceDTO({
          id: h.id,
          templateId: h.templateId,
          triggeredAt: h.triggeredAt.getTime(),
          result: h.result,
          error: h.error ?? null,
          notificationSent: h.notificationSent,
          notificationChannels: h.notificationChannel ?? null,
          createdAt: h.createdAt,
        });
        template.addHistory(history);
      }
    }

    return template;
  }

  /**
   * ReminderTemplate 鑱氬悎鏍?鈫?Prisma write data
   */
  private toWriteData(template: ReminderTemplate) {
    const dto = template.toPersistenceDTO();
    return {
      identityId: dto.identityId as string,
      name: dto.name,
      description: dto.description,
      type: dto.type,
      trigger: dto.trigger,
      recurrence: dto.recurrence,
      activeTime: dto.activeTime,
      activeHours: dto.activeHours,
      notificationConfig: dto.notificationConfig,
      selfEnabled: dto.selfEnabled,
      status: dto.status,
      reminderGroupId: dto.groupId,
      importanceLevel: dto.importanceLevel,
      tags: dto.tags,
      color: dto.color,
      icon: dto.icon,
      nextTriggerAt: dto.nextTriggerAt,
      stats: dto.stats,

      // Smart Frequency: Response Metrics
      clickRate: dto.clickRate ?? null,
      ignoreRate: dto.ignoreRate ?? null,
      avgResponseTime: dto.avgResponseTime ?? null,
      snoozeCount: dto.snoozeCount ?? 0,
      effectivenessScore: dto.effectivenessScore ?? null,
      sampleSize: dto.sampleSize ?? 0,
      lastAnalysisTime: dto.lastAnalysisTime ?? null,

      // Smart Frequency: Frequency Adjustment
      originalInterval: dto.originalInterval ?? null,
      adjustedInterval: dto.adjustedInterval ?? null,
      adjustmentReason: dto.adjustmentReason ?? null,
      adjustmentTime: dto.adjustmentTime ?? null,
      isAutoAdjusted: dto.isAutoAdjusted ?? false,
      userConfirmed: dto.userConfirmed ?? false,
      smartFrequencyEnabled: dto.smartFrequencyEnabled ?? true,

      version: dto.version,
      deletedAt: dto.deletedAt,
    };
  }

  /**
   * Protected persistence method - called by base class before event publishing
   */
  protected async persist(template: ReminderTemplate): Promise<void> {
    const dto = template.toPersistenceDTO();
    const writeData = this.toWriteData(template);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Upsert 鑱氬悎鏍?
      await tx.reminderTemplate.upsert({
        where: { id: dto.id as string },
        create: {
          id: dto.id as string,
          ...writeData,
        },
        update: writeData,
      });

      // 2. 绾ц仈淇濆瓨瀛愬疄浣?- 鍘嗗彶璁板綍
      const historyList = template.getAllHistory();
      if (historyList.length > 0) {
        for (const history of historyList) {
          const hDto = history.toPersistenceDTO();
          await tx.reminderHistory.upsert({
            where: { id: hDto.id },
            create: {
              id: hDto.id,
              templateId: hDto.templateId,
              triggeredAt: new Date(hDto.triggeredAt),
              result: hDto.result,
              error: hDto.error,
              notificationSent: hDto.notificationSent,
              notificationChannel: hDto.notificationChannels ?? null,
            },
            update: {
              result: hDto.result,
              error: hDto.error,
              notificationSent: hDto.notificationSent,
              notificationChannel: hDto.notificationChannels ?? null,
            },
          });
        }
      }
    });
  }

  async findById(
    id: string,
    options?: { includeHistory?: boolean },
  ): Promise<ReminderTemplate | null> {
    const data = await this.prisma.reminderTemplate.findUnique({
      where: { id },
      include: options?.includeHistory ? { history: { orderBy: { triggeredAt: 'desc' } } } : undefined,
    });
    if (!data) return null;
    return this.mapToEntity(data, (data as PrismaReminderTemplateWithHistory).history);
  }

  async findByIdentityId(
    identityId: string,
    options?: { includeHistory?: boolean; includeDeleted?: boolean },
  ): Promise<ReminderTemplate[]> {
    const where: Prisma.ReminderTemplateWhereInput = { identityId };
    if (!options?.includeDeleted) {
      where.deletedAt = null;
    }

    const data = await this.prisma.reminderTemplate.findMany({
      where,
      include: options?.includeHistory ? { history: { orderBy: { triggeredAt: 'desc' } } } : undefined,
      orderBy: { createdAt: 'asc' },
    });
    return data.map((d: PrismaReminderTemplateWithHistory) => this.mapToEntity(d, d.history));
  }

  async findByGroupId(
    groupId: string | null,
    options?: { includeHistory?: boolean; includeDeleted?: boolean },
  ): Promise<ReminderTemplate[]> {
    const where: Prisma.ReminderTemplateWhereInput = { reminderGroupId: groupId };
    if (!options?.includeDeleted) {
      where.deletedAt = null;
    }

    const data = await this.prisma.reminderTemplate.findMany({
      where,
      include: options?.includeHistory ? { history: { orderBy: { triggeredAt: 'desc' } } } : undefined,
      orderBy: { createdAt: 'asc' },
    });
    return data.map((d: PrismaReminderTemplateWithHistory) => this.mapToEntity(d, d.history));
  }

  async findActive(identityId?: string): Promise<ReminderTemplate[]> {
    const where: Prisma.ReminderTemplateWhereInput = {
      selfEnabled: true,
      status: 'Active',
      deletedAt: null,
    };
    if (identityId) {
      where.identityId = identityId;
    }

    const data = await this.prisma.reminderTemplate.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    return data.map((d: PrismaReminderTemplate) => this.mapToEntity(d));
  }

  async findByNextTriggerBefore(
    beforeTime: number,
    identityId?: string,
  ): Promise<ReminderTemplate[]> {
    const where: Prisma.ReminderTemplateWhereInput = {
      selfEnabled: true,
      status: 'Active',
      deletedAt: null,
      nextTriggerAt: { lte: new Date(beforeTime) },
    };
    if (identityId) {
      where.identityId = identityId;
    }

    const data = await this.prisma.reminderTemplate.findMany({
      where,
      orderBy: { nextTriggerAt: 'asc' },
    });
    return data.map((d: PrismaReminderTemplate) => this.mapToEntity(d));
  }

  async findByIds(
    ids: string[],
    options?: { includeHistory?: boolean },
  ): Promise<ReminderTemplate[]> {
    if (ids.length === 0) return [];

    const data = await this.prisma.reminderTemplate.findMany({
      where: { id: { in: ids } },
      include: options?.includeHistory ? { history: { orderBy: { triggeredAt: 'desc' } } } : undefined,
    });
    return data.map((d: PrismaReminderTemplateWithHistory) => this.mapToEntity(d, d.history));
  }

  async delete(id: string): Promise<void> {
    // Cascade deletion: ReminderHistory is set to cascade in Prisma schema
    await this.prisma.reminderTemplate.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.reminderTemplate.count({
      where: { id },
    });
    return count > 0;
  }

  async count(
    identityId: string,
    options?: { status?: ReminderStatus; includeDeleted?: boolean },
  ): Promise<number> {
    const where: Prisma.ReminderTemplateWhereInput = { identityId };
    if (options?.status) {
      where.status = options.status;
    }
    if (!options?.includeDeleted) {
      where.deletedAt = null;
    }

    return this.prisma.reminderTemplate.count({ where });
  }
}
