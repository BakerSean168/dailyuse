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
import { AggregateRepositoryBase, createEventBusAdapter } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils';
import { PrismaReminderTemplateMapper, type PrismaReminderTemplateWithHistory } from '../../mappers/prisma-reminder-template-mapper';

const eventBusAdapter = createEventBusAdapter(eventBus);

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
    return PrismaReminderTemplateMapper.toDomain(data, historyRecords);
  }

  /**
   * ReminderTemplate 鑱氬悎鏍?鈫?Prisma write data
   */
  private toWriteData(template: ReminderTemplate) {
    return PrismaReminderTemplateMapper.toPersistence(template);
  }

  /**
   * Protected persistence method - called by base class before event publishing
   */
  protected async persist(template: ReminderTemplate): Promise<void> {
    const writeData = this.toWriteData(template);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Upsert 鑱氬悎鏍?
      await tx.reminderTemplate.upsert({
        where: { id: template.id as string },
        create: {
          id: template.id as string,
          ...writeData,
        },
        update: writeData,
      });

      // 2. 绾ц仈淇濆瓨瀛愬疄浣?- 鍘嗗彶璁板綍
      const historyList = template.getAllHistory();
      if (historyList.length > 0) {
        for (const history of historyList) {
          const hDto = history.toServerDTO();
          await tx.reminderHistory.upsert({
            where: { id: hDto.id },
            create: {
              id: hDto.id,
              templateId: hDto.templateId,
              triggeredAt: new Date(hDto.triggeredAt),
              result: hDto.result,
              error: hDto.error,
              notificationSent: hDto.notificationSent,
              notificationChannel: hDto.notificationChannels
                ? JSON.stringify(hDto.notificationChannels)
                : null,
            },
            update: {
              result: hDto.result,
              error: hDto.error,
              notificationSent: hDto.notificationSent,
              notificationChannel: hDto.notificationChannels
                ? JSON.stringify(hDto.notificationChannels)
                : null,
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
