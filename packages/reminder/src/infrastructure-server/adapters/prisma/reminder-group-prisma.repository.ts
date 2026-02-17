/**
 * ReminderGroupPrismaRepository - Prisma Implementation of IReminderGroupRepository
 * 提醒分组仓储 - Prisma 实现
 *
 * 聚合根：ReminderGroup
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IReminderGroupRepository } from '../../../domain-server/repositories/IReminderGroupRepository';
import type { ControlMode, ReminderStatus, GroupStatsServerDTO } from '@dailyuse/contracts/reminder';
import { ReminderGroup } from '../../../domain-server/aggregates/reminder-group';
import { AggregateRepositoryBase, type IEventBus } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils';

/**
 * Global EventBus adapter
 */
const eventBusAdapter: IEventBus = {
  async publish(event) {
    eventBus.send(event.eventType as any, event.payload);
  },
  async send(eventType, payload) {
    eventBus.send(eventType as any, payload);
  },
};

export class ReminderGroupPrismaRepository
  extends AggregateRepositoryBase<ReminderGroup>
  implements IReminderGroupRepository
{
  constructor(private readonly prisma: PrismaClient) {
    super(eventBusAdapter);
  }

  /**
   * Prisma record → ReminderGroup 聚合根
   */
  private mapToEntity(data: any): ReminderGroup {
    return ReminderGroup.fromPersistenceDTO({
      id: data.id,
      identityId: data.identityId,
      name: data.name,
      description: data.description ?? null,
      color: data.color ?? null,
      icon: data.icon ?? null,
      controlMode: data.controlMode as ControlMode,
      enabled: data.enabled,
      status: data.status as ReminderStatus,
      order: data.order,
      stats: data.stats
        ? (JSON.parse(data.stats) as GroupStatsServerDTO)
        : {
            totalTemplates: 0,
            activeTemplates: 0,
            pausedTemplates: 0,
            selfEnabledTemplates: 0,
            selfPausedTemplates: 0,
          },
      version: data.version,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? null,
    });
  }

  /**
   * ReminderGroup 聚合根 → Prisma write data
   */
  private toWriteData(group: ReminderGroup) {
    const dto = group.toPersistenceDTO();
    return {
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description,
      color: dto.color,
      icon: dto.icon,
      controlMode: dto.controlMode,
      enabled: dto.enabled,
      status: dto.status,
      order: dto.order,
      stats: JSON.stringify(dto.stats),
      version: dto.version,
      deletedAt: dto.deletedAt,
    };
  }

  /**
   * Protected persistence method - called by base class before event publishing
   */
  protected async persist(group: ReminderGroup): Promise<void> {
    const dto = group.toPersistenceDTO();
    const writeData = this.toWriteData(group);

    await this.prisma.reminderGroup.upsert({
      where: { id: dto.id },
      create: {
        id: dto.id,
        ...writeData,
      },
      update: writeData,
    });
  }

  async findById(id: string): Promise<ReminderGroup | null> {
    const data = await this.prisma.reminderGroup.findUnique({
      where: { id },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findByIdentityId(
    identityId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<ReminderGroup[]> {
    const where: any = { identityId };
    if (!options?.includeDeleted) {
      where.deletedAt = null;
    }

    const data = await this.prisma.reminderGroup.findMany({
      where,
      orderBy: { order: 'asc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findByControlMode(
    identityId: string,
    controlMode: ControlMode,
    options?: { includeDeleted?: boolean },
  ): Promise<ReminderGroup[]> {
    const where: any = { identityId, controlMode };
    if (!options?.includeDeleted) {
      where.deletedAt = null;
    }

    const data = await this.prisma.reminderGroup.findMany({
      where,
      orderBy: { order: 'asc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findActive(identityId?: string): Promise<ReminderGroup[]> {
    const where: any = {
      enabled: true,
      status: 'Active',
      deletedAt: null,
    };
    if (identityId) {
      where.identityId = identityId;
    }

    const data = await this.prisma.reminderGroup.findMany({
      where,
      orderBy: { order: 'asc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findByIds(ids: string[]): Promise<ReminderGroup[]> {
    if (ids.length === 0) return [];

    const data = await this.prisma.reminderGroup.findMany({
      where: { id: { in: ids } },
      orderBy: { order: 'asc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findByName(
    identityId: string,
    name: string,
    excludeId?: string,
  ): Promise<ReminderGroup | null> {
    const where: any = {
      identityId,
      name,
      deletedAt: null,
    };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const data = await this.prisma.reminderGroup.findFirst({ where });
    return data ? this.mapToEntity(data) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.reminderGroup.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.reminderGroup.count({
      where: { id },
    });
    return count > 0;
  }

  async count(
    identityId: string,
    options?: { status?: ReminderStatus; includeDeleted?: boolean },
  ): Promise<number> {
    const where: any = { identityId };
    if (options?.status) {
      where.status = options.status;
    }
    if (!options?.includeDeleted) {
      where.deletedAt = null;
    }

    return this.prisma.reminderGroup.count({ where });
  }
}
