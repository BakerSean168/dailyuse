/**
 * ReminderGroupPrismaRepository - Prisma Implementation of IReminderGroupRepository
 * 提醒分组仓储 - Prisma 实现
 *
 * 聚合根：ReminderGroup
 */

import type { PrismaClient, ReminderGroup as PrismaReminderGroup, Prisma } from '@dailyuse/database';
import type { IReminderGroupRepository } from '../../../domain-server/repositories/i-reminder-group-repository';
import type { ControlMode, ReminderStatus } from '@dailyuse/contracts/reminder';
import { ReminderGroup } from '../../../domain-server/aggregates/reminder-group';
import { AggregateRepositoryBase, createEventBusAdapter } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils';
import { PrismaReminderGroupMapper } from './mappers/prisma-reminder-group-mapper';

const eventBusAdapter = createEventBusAdapter(eventBus);

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
  private mapToEntity(data: PrismaReminderGroup): ReminderGroup {
    return PrismaReminderGroupMapper.toDomain(data);
  }

  /**
   * ReminderGroup 聚合根 → Prisma write data
   */
  private toWriteData(group: ReminderGroup) {
    return PrismaReminderGroupMapper.toPersistence(group);
  }

  /**
   * Protected persistence method - called by base class before event publishing
   */
  protected async persist(group: ReminderGroup): Promise<void> {
    const writeData = this.toWriteData(group);

    await this.prisma.reminderGroup.upsert({
      where: { id: group.id },
      create: {
        id: group.id,
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
    const where: Prisma.ReminderGroupWhereInput = { identityId };
    if (!options?.includeDeleted) {
      where.deletedAt = null;
    }

    const data = await this.prisma.reminderGroup.findMany({
      where,
      orderBy: { order: 'asc' },
    });
    return data.map((d: PrismaReminderGroup) => this.mapToEntity(d));
  }

  async findByControlMode(
    identityId: string,
    controlMode: ControlMode,
    options?: { includeDeleted?: boolean },
  ): Promise<ReminderGroup[]> {
    const where: Prisma.ReminderGroupWhereInput = { identityId, controlMode };
    if (!options?.includeDeleted) {
      where.deletedAt = null;
    }

    const data = await this.prisma.reminderGroup.findMany({
      where,
      orderBy: { order: 'asc' },
    });
    return data.map((d: PrismaReminderGroup) => this.mapToEntity(d));
  }

  async findActive(identityId?: string): Promise<ReminderGroup[]> {
    const where: Prisma.ReminderGroupWhereInput = {
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
    return data.map((d: PrismaReminderGroup) => this.mapToEntity(d));
  }

  async findByIds(ids: string[]): Promise<ReminderGroup[]> {
    if (ids.length === 0) return [];

    const data = await this.prisma.reminderGroup.findMany({
      where: { id: { in: ids } },
      orderBy: { order: 'asc' },
    });
    return data.map((d: PrismaReminderGroup) => this.mapToEntity(d));
  }

  async findByName(
    identityId: string,
    name: string,
    excludeId?: string,
  ): Promise<ReminderGroup | null> {
    const where: Prisma.ReminderGroupWhereInput = {
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
    const where: Prisma.ReminderGroupWhereInput = { identityId };
    if (options?.status) {
      where.status = options.status;
    }
    if (!options?.includeDeleted) {
      where.deletedAt = null;
    }

    return this.prisma.reminderGroup.count({ where });
  }
}
