/**
 * TaskInstancePrismaRepository - Prisma Implementation of ITaskInstanceRepository
 * 任务实例仓储 - Prisma 实现
 *
 * 聚合根：TaskInstance
 */

import type { PrismaClient, TaskInstance as PrismaTaskInstance } from '@dailyuse/database';
import { TaskInstance } from '@/domain-server/aggregates/task-instance';
import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import type { TaskTemplateInstanceStats } from '@/domain-server/repositories/ITaskInstanceRepository';
import type { TaskInstanceStatus } from '@dailyuse/contracts/task';
import { AggregateRepositoryBase, createEventBusAdapter } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils';
import { PrismaTaskInstanceMapper } from './mappers/prisma-task-instance-mapper';

const eventBusAdapter = createEventBusAdapter(eventBus);

export class TaskInstancePrismaRepository
  extends AggregateRepositoryBase<TaskInstance>
  implements ITaskInstanceRepository
{
  constructor(private prisma: PrismaClient) {
    super(eventBusAdapter);
  }

  /**
   * Prisma record  TaskInstance 聚合根
   */
  private mapToEntity(data: PrismaTaskInstance): TaskInstance {
    return PrismaTaskInstanceMapper.toDomain(data);
  }

  /**
   * TaskInstance 聚合根  Prisma write data
   */
  private toWriteData(dto: ReturnType<TaskInstance['toServerDTO']>) {
    return PrismaTaskInstanceMapper.toPersistence(dto);
  }

  /**
   * Protected persistence method - called by base class before event publishing
   */
  protected async persist(instance: TaskInstance): Promise<void> {
    const dto = instance.toServerDTO();
    const data = this.toWriteData(dto);

    await this.prisma.taskInstance.upsert({
      where: { id: dto.id },
      create: {
        id: dto.id,
        ...data,
        createdAt: new Date(dto.createdAt),
      },
      update: data,
    });
  }

  async saveMany(instances: TaskInstance[]): Promise<void> {
    const operations = instances.map((instance) => {
      const dto = instance.toServerDTO();
      const data = this.toWriteData(dto);
      return this.prisma.taskInstance.upsert({
        where: { id: dto.id },
        create: {
          id: dto.id,
          ...data,
          createdAt: new Date(dto.createdAt),
        },
        update: data,
      });
    });
    await this.prisma.$transaction(operations);
  }

  async findById(id: string): Promise<TaskInstance | null> {
    const data = await this.prisma.taskInstance.findUnique({
      where: { id },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findByTemplateId(templateId: string): Promise<TaskInstance[]> {
    const data = await this.prisma.taskInstance.findMany({
      where: { templateId, deletedAt: null },
      orderBy: { instanceDate: 'desc' },
    });
    return data.map((d: PrismaTaskInstance) => this.mapToEntity(d));
  }

  async findByIdentityId(identityId: string): Promise<TaskInstance[]> {
    const data = await this.prisma.taskInstance.findMany({
      where: { identityId, deletedAt: null },
      orderBy: { instanceDate: 'desc' },
    });
    return data.map((d: PrismaTaskInstance) => this.mapToEntity(d));
  }

  async findByDateRange(
    identityId: string,
    startDate: number,
    endDate: number,
  ): Promise<TaskInstance[]> {
    const data = await this.prisma.taskInstance.findMany({
      where: {
        identityId,
        instanceDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        deletedAt: null,
      },
      orderBy: { instanceDate: 'asc' },
    });
    return data.map((d: PrismaTaskInstance) => this.mapToEntity(d));
  }

  async findByStatus(identityId: string, status: TaskInstanceStatus): Promise<TaskInstance[]> {
    const data = await this.prisma.taskInstance.findMany({
      where: { identityId, status, deletedAt: null },
      orderBy: { instanceDate: 'desc' },
    });
    return data.map((d: PrismaTaskInstance) => this.mapToEntity(d));
  }

  async findOverdueInstances(identityId: string): Promise<TaskInstance[]> {
    const now = new Date();
    const data = await this.prisma.taskInstance.findMany({
      where: {
        identityId,
        status: 'Pending',
        instanceDate: { lt: now },
        deletedAt: null,
      },
      orderBy: { instanceDate: 'asc' },
    });
    return data.map((d: PrismaTaskInstance) => this.mapToEntity(d));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.taskInstance.delete({ where: { id } });
  }

  async deleteMany(ids: string[]): Promise<void> {
    await this.prisma.taskInstance.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async deleteByTemplateId(templateId: string): Promise<void> {
    await this.prisma.taskInstance.deleteMany({
      where: { templateId },
    });
  }

  async countFutureInstances(templateId: string, fromDate: number = Date.now()): Promise<number> {
    return this.prisma.taskInstance.count({
      where: {
        templateId,
        instanceDate: { gte: new Date(fromDate) },
      },
    });
  }

  async findByTemplateIdAndDateRange(
    templateId: string,
    startDate: number,
    endDate: number,
  ): Promise<TaskInstance[]> {
    const data = await this.prisma.taskInstance.findMany({
      where: {
        templateId,
        instanceDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        deletedAt: null,
      },
      orderBy: { instanceDate: 'asc' },
    });
    return data.map((d: PrismaTaskInstance) => this.mapToEntity(d));
  }

  async getTemplateStats(templateIds: string[]): Promise<Record<string, TaskTemplateInstanceStats>> {
    if (templateIds.length === 0) {
      return {};
    }

    const grouped = await this.prisma.taskInstance.groupBy({
      by: ['templateId', 'status'],
      where: {
        templateId: { in: templateIds },
        deletedAt: null,
      },
      _count: {
        _all: true,
      },
    });

    const stats: Record<string, TaskTemplateInstanceStats> = {};

    for (const templateId of templateIds) {
      stats[templateId] = {
        templateId,
        instanceCount: 0,
        completedInstanceCount: 0,
        pendingInstanceCount: 0,
        completionRate: 0,
      };
    }

    for (const row of grouped) {
      const stat = stats[row.templateId];
      if (!stat) {
        continue;
      }

      const count = row._count._all;
      stat.instanceCount += count;

      if (row.status === 'Completed') {
        stat.completedInstanceCount += count;
      }

      if (row.status === 'Pending') {
        stat.pendingInstanceCount += count;
      }
    }

    for (const stat of Object.values(stats)) {
      stat.completionRate =
        stat.instanceCount > 0
          ? Math.round((stat.completedInstanceCount / stat.instanceCount) * 100)
          : 0;
    }

    return stats;
  }

  async deleteIncompleteInstancesFrom(templateId: string, fromDate: number): Promise<number> {
    const result = await this.prisma.taskInstance.deleteMany({
      where: {
        templateId,
        instanceDate: { gte: new Date(fromDate) },
        status: { in: ['Pending', 'InProgress'] },
      },
    });
    return result.count;
  }
}
