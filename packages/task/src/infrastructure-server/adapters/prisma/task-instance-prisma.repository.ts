import type { PrismaClient } from '../../../generated/prisma/client';
import type { ITaskInstanceRepository } from '../../../domain-server/repositories/ITaskInstanceRepository';
import { TaskInstance } from '../../../domain-server/aggregates/task-instance';
import type { TaskInstanceStatus } from '@dailyuse/contracts/task';

/**
 * Prisma implementation of ITaskInstanceRepository
 */
export class TaskInstancePrismaRepository implements ITaskInstanceRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToEntity(data: any): TaskInstance {
    return TaskInstance.fromPersistenceDTO({
      uuid: data.uuid,
      templateUuid: data.templateUuid,
      accountUuid: data.accountUuid,
      instanceDate: typeof data.instanceDate === 'bigint' ? Number(data.instanceDate) : data.instanceDate,
      timeConfig: data.timeConfig || '{}',
      importance: data.importance || 'Moderate',
      priority: data.priority || undefined,
      status: data.status,
      completionRecord: data.completionRecord || undefined,
      skipRecord: data.skipRecord || undefined,
      actualStartTime: data.actualStartTime ? (typeof data.actualStartTime === 'bigint' ? Number(data.actualStartTime) : data.actualStartTime) : undefined,
      actualEndTime: data.actualEndTime ? (typeof data.actualEndTime === 'bigint' ? Number(data.actualEndTime) : data.actualEndTime) : undefined,
      note: data.note || undefined,
      createdAt: typeof data.createdAt === 'bigint' ? Number(data.createdAt) : data.createdAt,
      updatedAt: typeof data.updatedAt === 'bigint' ? Number(data.updatedAt) : data.updatedAt,
    });
  }

  async save(instance: TaskInstance): Promise<void> {
    const data = instance.toPersistenceDTO();
    const updateData: any = {
      templateUuid: data.templateUuid,
      accountUuid: data.accountUuid,
      instanceDate: new Date(data.instanceDate),
      timeConfig: data.timeConfig || '{}',
      importance: data.importance || 'Moderate',
      priority: data.priority || undefined,
      status: data.status,
      actualStartTime: data.actualStartTime ? new Date(data.actualStartTime) : undefined,
      actualEndTime: data.actualEndTime ? new Date(data.actualEndTime) : undefined,
      note: data.note || undefined,
      updatedAt: new Date(data.updatedAt),
    };

    // Only set completion/skip records if they exist
    if (data.completionRecord) {
      updateData.completionRecord = data.completionRecord;
    }
    if (data.skipRecord) {
      updateData.skipRecord = data.skipRecord;
    }

    const createData = {
      ...updateData,
      uuid: data.uuid,
      createdAt: new Date(data.createdAt),
    };

    await this.prisma.taskInstance.upsert({
      where: { uuid: data.uuid },
      update: updateData,
      create: createData,
    });
  }

  async saveMany(instances: TaskInstance[]): Promise<void> {
    const transaction = instances.map((instance) => {
      const data = instance.toPersistenceDTO();
      const updateData: any = {
        templateUuid: data.templateUuid,
        accountUuid: data.accountUuid,
        instanceDate: new Date(data.instanceDate),
        timeConfig: data.timeConfig || '{}',
        importance: data.importance || 'Moderate',
        priority: data.priority || undefined,
        status: data.status,
        actualStartTime: data.actualStartTime ? new Date(data.actualStartTime) : undefined,
        actualEndTime: data.actualEndTime ? new Date(data.actualEndTime) : undefined,
        note: data.note || undefined,
        updatedAt: new Date(data.updatedAt),
      };

      // Only set completion/skip records if they exist
      if (data.completionRecord) {
        updateData.completionRecord = data.completionRecord;
      }
      if (data.skipRecord) {
        updateData.skipRecord = data.skipRecord;
      }

      const createData = {
        ...updateData,
        uuid: data.uuid,
        createdAt: new Date(data.createdAt),
      };

      return this.prisma.taskInstance.upsert({
        where: { uuid: data.uuid },
        update: updateData,
        create: createData,
      });
    });
    await this.prisma.$transaction(transaction);
  }

  async findByUuid(uuid: string): Promise<TaskInstance | null> {
    const data = await this.prisma.taskInstance.findUnique({
      where: { uuid },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findByTemplate(templateUuid: string): Promise<TaskInstance[]> {
    const data = await this.prisma.taskInstance.findMany({
      where: { templateUuid },
    });
    return data.map((d) => this.mapToEntity(d));
  }

  async findByAccount(accountUuid: string): Promise<TaskInstance[]> {
    const data = await this.prisma.taskInstance.findMany({
      where: { accountUuid },
    });
    return data.map((d) => this.mapToEntity(d));
  }

  async findByDateRange(
    accountUuid: string,
    startDate: number,
    endDate: number,
  ): Promise<TaskInstance[]> {
    const data = await this.prisma.taskInstance.findMany({
      where: {
        accountUuid,
        instanceDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });
    return data.map((d) => this.mapToEntity(d));
  }

  async findByStatus(
    accountUuid: string,
    status: TaskInstanceStatus,
  ): Promise<TaskInstance[]> {
    const data = await this.prisma.taskInstance.findMany({
      where: {
        accountUuid,
        status,
      },
    });
    return data.map((d) => this.mapToEntity(d));
  }

  async findOverdueInstances(accountUuid: string): Promise<TaskInstance[]> {
    const now = new Date();
    const data = await this.prisma.taskInstance.findMany({
      where: {
        accountUuid,
        status: 'PENDING',
        instanceDate: { lt: now },
      },
    });
    return data.map((d) => this.mapToEntity(d));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.taskInstance.delete({
      where: { uuid },
    });
  }

  async deleteMany(uuids: string[]): Promise<void> {
    await this.prisma.taskInstance.deleteMany({
      where: { uuid: { in: uuids } },
    });
  }

  async deleteByTemplate(templateUuid: string): Promise<void> {
    await this.prisma.taskInstance.deleteMany({
      where: { templateUuid },
    });
  }

  async countFutureInstances(
    templateUuid: string,
    fromDate: number = Date.now(),
  ): Promise<number> {
    const count = await this.prisma.taskInstance.count({
      where: {
        templateUuid,
        instanceDate: { gte: new Date(fromDate) },
      },
    });
    return count;
  }

  async findByTemplateUuidAndDateRange(
    templateUuid: string,
    startDate: number,
    endDate: number,
  ): Promise<TaskInstance[]> {
    const data = await this.prisma.taskInstance.findMany({
      where: {
        templateUuid,
        instanceDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });
    return data.map((d) => this.mapToEntity(d));
  }

  async deleteFuturePendingInstances(templateUuid: string, fromDate: number): Promise<void> {
    await this.prisma.taskInstance.deleteMany({
      where: {
        templateUuid,
        instanceDate: { gte: new Date(fromDate) },
        status: 'PENDING',
      },
    });
  }
}
