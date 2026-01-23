import type {  PrismaClient  } from "@prisma/client";
import type { ITaskInstanceRepository } from '@dailyuse/domain-server/task';
import { TaskInstance } from '@dailyuse/domain-server/task';
import { TaskInstanceStatus } from '@dailyuse/contracts/task';

/**
 * Prisma implementation of ITaskInstanceRepository
 */
export class TaskInstancePrismaRepository implements ITaskInstanceRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToEntity(data: any): TaskInstance {
    // Parse JSON fields if they are strings (Prisma might return them as objects if typed, or strings if raw)
    // Assuming standard Prisma behavior with Json type
    return TaskInstance.fromPersistenceDTO({
      uuid: data.uuid,
      templateUuid: data.templateUuid,
      accountUuid: data.accountUuid,
      instanceDate: Number(data.instanceDate),
      status: data.status as TaskInstanceStatus,
      completionRecord: data.completionRecord ? (typeof data.completionRecord === 'string' ? JSON.parse(data.completionRecord) : data.completionRecord) : undefined,
      skipRecord: data.skipRecord ? (typeof data.skipRecord === 'string' ? JSON.parse(data.skipRecord) : data.skipRecord) : undefined,
      createdAt: Number(data.createdAt),
      updatedAt: Number(data.updatedAt),
    });
  }

  async save(instance: TaskInstance): Promise<void> {
    const data = instance.toPersistenceDTO();
    await this.prisma.taskInstance.upsert({
      where: { uuid: data.uuid },
      update: {
        templateUuid: data.templateUuid,
        accountUuid: data.accountUuid,
        instanceDate: BigInt(data.instanceDate),
        status: data.status,
        completionRecord: data.completionRecord ?? PrismaClient.JsonNull,
        skipRecord: data.skipRecord ?? PrismaClient.JsonNull,
        updatedAt: BigInt(data.updatedAt),
      },
      create: {
        uuid: data.uuid,
        templateUuid: data.templateUuid,
        accountUuid: data.accountUuid,
        instanceDate: BigInt(data.instanceDate),
        status: data.status,
        completionRecord: data.completionRecord ?? PrismaClient.JsonNull,
        skipRecord: data.skipRecord ?? PrismaClient.JsonNull,
        createdAt: BigInt(data.createdAt),
        updatedAt: BigInt(data.updatedAt),
      },
    });
  }

  async saveMany(instances: TaskInstance[]): Promise<void> {
    // Prisma createMany doesn't support upsert, and we might have updates.
    // Ideally use transaction.
    const transaction = instances.map((instance) => {
        const data = instance.toPersistenceDTO();
        return this.prisma.taskInstance.upsert({
            where: { uuid: data.uuid },
            update: {
                templateUuid: data.templateUuid,
                accountUuid: data.accountUuid,
                instanceDate: BigInt(data.instanceDate),
                status: data.status,
                completionRecord: data.completionRecord ?? PrismaClient.JsonNull,
                skipRecord: data.skipRecord ?? PrismaClient.JsonNull,
                updatedAt: BigInt(data.updatedAt),
            },
            create: {
                uuid: data.uuid,
                templateUuid: data.templateUuid,
                accountUuid: data.accountUuid,
                instanceDate: BigInt(data.instanceDate),
                status: data.status,
                completionRecord: data.completionRecord ?? PrismaClient.JsonNull,
                skipRecord: data.skipRecord ?? PrismaClient.JsonNull,
                createdAt: BigInt(data.createdAt),
                updatedAt: BigInt(data.updatedAt),
            },
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
          gte: BigInt(startDate),
          lte: BigInt(endDate),
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
    const now = BigInt(Date.now());
    const data = await this.prisma.taskInstance.findMany({
      where: {
        accountUuid,
        status: TaskInstanceStatus.PENDING,
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
        instanceDate: { gte: BigInt(fromDate) },
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
          gte: BigInt(startDate),
          lte: BigInt(endDate),
        },
      },
    });
    return data.map((d) => this.mapToEntity(d));
  }

  async deleteFuturePendingInstances(templateUuid: string, fromDate: number): Promise<void> {
      await this.prisma.taskInstance.deleteMany({
          where: {
              templateUuid,
              instanceDate: { gte: BigInt(fromDate) },
              status: TaskInstanceStatus.PENDING
          }
      });
  }
}
