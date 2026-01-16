import { PrismaClient } from '@prisma/client';
import type { ITaskInstanceRepository } from '@dailyuse/domain-server/task';
import { TaskInstance } from '@dailyuse/domain-server/task';
import type { TaskInstanceStatus } from '@dailyuse/contracts/task';
import { withRetry } from '@/shared/infrastructure/config/prisma';

/**
 * TaskInstance Prisma Ө��
 * �UZ9�P�S
 * JSON W�time_config, completionRecord, skipRecord
 */
export class PrismaTaskInstanceRepository implements ITaskInstanceRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToEntity(data: any): TaskInstance {
    return TaskInstance.fromPersistenceDTO({
      uuid: data.uuid,
      templateUuid: data.templateUuid,
      accountUuid: data.accountUuid,
      instanceDate: Number(data.instanceDate),
      timeConfig: data.timeConfig,
      importance: data.importance || 'Moderate',
      status: data.status,
      completionRecord: data.completionRecord,
      skipRecord: data.skipRecord,
      actualStartTime: data.actualStartTime ? Number(data.actualStartTime) : null,
      actualEndTime: data.actualEndTime ? Number(data.actualEndTime) : null,
      note: data.note,
      createdAt: Number(data.createdAt),
      updatedAt: Number(data.updatedAt),
    });
  }

  async save(instance: TaskInstance): Promise<void> {
    const persistence = instance.toPersistenceDTO();

    const data = {
      uuid: persistence.uuid,
      templateUuid: persistence.templateUuid,
      accountUuid: persistence.accountUuid,
      instanceDate: new Date(persistence.instanceDate), // Convert timestamp to Date
      timeConfig: persistence.timeConfig,
      status: persistence.status,
      completionRecord: persistence.completionRecord,
      skipRecord: persistence.skipRecord,
      actualStartTime: persistence.actualStartTime ? new Date(persistence.actualStartTime) : null,
      actualEndTime: persistence.actualEndTime ? new Date(persistence.actualEndTime) : null,
      note: persistence.note,
      createdAt: new Date(persistence.createdAt),
      updatedAt: new Date(persistence.updatedAt),
    };

    await withRetry(() =>
      this.prisma.taskInstance.upsert({
        where: { uuid: persistence.uuid },
        create: data,
        update: {
          ...data,
          uuid: undefined, // Cannot update uuid
          templateUuid: undefined,
          accountUuid: undefined,
          createdAt: undefined,
        },
      })
    );
  }

  async saveMany(instances: TaskInstance[]): Promise<void> {
    // Use Prisma's createMany for efficiency if possible, but upsert logic requires looping.
    // For now, keeping the loop to respect the save logic.
    for (const instance of instances) {
      await this.save(instance);
    }
  }

  async findByUuid(uuid: string): Promise<TaskInstance | null> {
    const data = await withRetry(() =>
      this.prisma.taskInstance.findUnique({ where: { uuid } })
    );
    return data ? this.mapToEntity(data) : null;
  }

  async findByTemplate(templateUuid: string): Promise<TaskInstance[]> {
    const instances = await withRetry(() =>
      this.prisma.taskInstance.findMany({
        where: { templateUuid },
        orderBy: { instanceDate: 'desc' },
      })
    );
    return instances.map(this.mapToEntity);
  }

  async findByAccount(accountUuid: string): Promise<TaskInstance[]> {
    const instances = await withRetry(() =>
      this.prisma.taskInstance.findMany({
        where: { accountUuid },
        orderBy: { instanceDate: 'desc' },
      })
    );
    return instances.map(this.mapToEntity);
  }

  async findByDateRange(
    accountUuid: string,
    startDate: number,
    endDate: number,
  ): Promise<TaskInstance[]> {
    const instances = await withRetry(() =>
      this.prisma.taskInstance.findMany({
        where: {
          accountUuid,
          instanceDate: {
            gte: new Date(startDate), // Convert timestamp to Date
            lte: new Date(endDate), // Convert timestamp to Date
          },
        },
        orderBy: { instanceDate: 'asc' },
      })
    );
    return instances.map(this.mapToEntity);
  }

  async findByStatus(accountUuid: string, status: TaskInstanceStatus): Promise<TaskInstance[]> {
    const instances = await withRetry(() =>
      this.prisma.taskInstance.findMany({
        where: { accountUuid, status },
        orderBy: { instanceDate: 'desc' },
      })
    );
    return instances.map(this.mapToEntity);
  }

  async findOverdueInstances(accountUuid: string): Promise<TaskInstance[]> {
    const oneDayAgo = new Date(Date.now() - 86400000); // Convert to Date
    const instances = await withRetry(() =>
      this.prisma.taskInstance.findMany({
        where: {
          accountUuid,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          instanceDate: { lt: oneDayAgo },
        },
        orderBy: { instanceDate: 'asc' },
      })
    );
    return instances.map(this.mapToEntity);
  }

  async delete(uuid: string): Promise<void> {
    await withRetry(() =>
      this.prisma.taskInstance.delete({ where: { uuid } })
    );
  }

  async deleteMany(uuids: string[]): Promise<void> {
    await withRetry(() =>
      this.prisma.taskInstance.deleteMany({ where: { uuid: { in: uuids } } })
    );
  }

  async deleteByTemplate(templateUuid: string): Promise<void> {
    await withRetry(() =>
      this.prisma.taskInstance.deleteMany({ where: { templateUuid } })
    );
  }

  async countFutureInstances(templateUuid: string, fromDate?: number): Promise<number> {
    const date = fromDate ? new Date(fromDate) : new Date();
    return await withRetry(() =>
      this.prisma.taskInstance.count({
        where: {
          templateUuid,
          instanceDate: { gte: date },
        },
      })
    );
  }

  async findByTemplateUuidAndDateRange(
    templateUuid: string,
    startDate: number,
    endDate: number,
  ): Promise<TaskInstance[]> {
    const instances = await withRetry(() =>
      this.prisma.taskInstance.findMany({
        where: {
          templateUuid,
          instanceDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        orderBy: { instanceDate: 'asc' },
      })
    );
    return instances.map(this.mapToEntity);
  }
}
