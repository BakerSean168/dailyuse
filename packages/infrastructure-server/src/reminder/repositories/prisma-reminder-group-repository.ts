import { PrismaClient } from '@prisma/client';
import { ReminderGroup } from '@dailyuse/domain-server/reminder';
import type { IReminderGroupRepository } from '@dailyuse/domain-server/reminder';
import type { ReminderTemplateServerDTO, ReminderGroupServerDTO } from '@dailyuse/contracts/reminder';
import { ControlMode, ReminderStatus } from '@dailyuse/contracts/reminder';

/**
 * ReminderGroup Prisma 仓储实现
 * 简单聚合根，无子实体
 * JSON 字段：stats
 */
export class PrismaReminderGroupRepository implements IReminderGroupRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToEntity(data: any): ReminderGroup {
    return ReminderGroup.fromPersistenceDTO({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      name: data.name,
      description: data.description,
      control_mode: data.controlMode,
      enabled: data.enabled,
      status: data.status,
      order: data.order,
      color: data.color,
      icon: data.icon,
      stats: data.stats, // stats is a JSON string
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
      deletedAt: data.deletedAt ? data.deletedAt.getTime() : null,
    });
  }

  async save(group: ReminderGroup): Promise<void> {
    const persistence = group.toPersistenceDTO();
    const data = {
      name: persistence.name,
      description: persistence.description,
      controlMode: persistence.control_mode,
      enabled: persistence.enabled,
      status: persistence.status,
      order: persistence.order,
      color: persistence.color,
      icon: persistence.icon,
      stats: persistence.stats, // stats is already a JSON string from toPersistenceDTO
      updatedAt: new Date(persistence.updatedAt),
      deletedAt: persistence.deletedAt ? new Date(persistence.deletedAt) : null,
    };

    await this.prisma.reminderGroup.upsert({
      where: { uuid: persistence.uuid },
      create: {
        uuid: persistence.uuid,
        account: { connect: { uuid: persistence.accountUuid } },
        createdAt: new Date(persistence.createdAt),
        ...data,
      },
      update: data,
    });
  }

  async findById(uuid: string): Promise<ReminderGroup | null> {
    const data = await this.prisma.reminderGroup.findUnique({ where: { uuid } });
    return data ? this.mapToEntity(data) : null;
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: { includeDeleted?: boolean },
  ): Promise<ReminderGroup[]> {
    const groups = await this.prisma.reminderGroup.findMany({
      where: {
        accountUuid,
        deletedAt: options?.includeDeleted ? undefined : null,
      },
      orderBy: { order: 'asc' },
    });
    return groups.map(this.mapToEntity);
  }

  async findByControlMode(
    accountUuid: string,
    controlMode: ControlMode,
    options?: { includeDeleted?: boolean },
  ): Promise<ReminderGroup[]> {
    const groups = await this.prisma.reminderGroup.findMany({
      where: {
        accountUuid,
        controlMode: controlMode,
        deletedAt: options?.includeDeleted ? undefined : null,
      },
      orderBy: { order: 'asc' },
    });
    return groups.map(this.mapToEntity);
  }

  async findActive(accountUuid?: string): Promise<ReminderGroup[]> {
    const groups = await this.prisma.reminderGroup.findMany({
      where: {
        accountUuid,
        status: 'ACTIVE',
        deletedAt: null,
      },
      orderBy: { order: 'asc' },
    });
    return groups.map(this.mapToEntity);
  }

  async findByIds(uuids: string[]): Promise<ReminderGroup[]> {
    const groups = await this.prisma.reminderGroup.findMany({
      where: { uuid: { in: uuids } },
    });
    return groups.map(this.mapToEntity);
  }

  async findByName(
    accountUuid: string,
    name: string,
    excludeUuid?: string,
  ): Promise<ReminderGroup | null> {
    const data = await this.prisma.reminderGroup.findFirst({
      where: {
        accountUuid,
        name,
        uuid: excludeUuid ? { not: excludeUuid } : undefined,
      },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.reminderGroup.delete({ where: { uuid } });
  }

  async softDelete(uuid: string): Promise<void> {
    await this.prisma.reminderGroup.update({
      where: { uuid },
      data: { deletedAt: new Date() },
    });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.reminderGroup.count({ where: { uuid } });
    return count > 0;
  }

  async count(
    accountUuid: string,
    options?: { status?: ReminderStatus; includeDeleted?: boolean },
  ): Promise<number> {
    return this.prisma.reminderGroup.count({
      where: {
        accountUuid,
        status: options?.status,
        deletedAt: options?.includeDeleted ? undefined : null,
      },
    });
  }
}

