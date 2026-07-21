/**
 * TaskInstancePrismaRepository - Prisma Implementation of ITaskInstanceRepository
 * 任务实例仓储 - Prisma 实现
 *
 * 聚合根：TaskInstance
 */

import type { PrismaClient, TaskInstance as PrismaTaskInstance } from '@dailyuse/database';
import { TaskInstance } from '../../../domain/aggregates/task-instance';
import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type { TaskTemplateInstanceStats } from '../../../domain/repositories/i-task-instance-repository';
import type { TaskInstanceStatus } from '@dailyuse/contracts/task';
import {
  AggregateRepositoryBase,
  createEventBusAdapter,
  type IEventBus,
} from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils/domain';
import { PrismaTaskInstanceMapper } from './mappers/prisma-task-instance-mapper';

const eventBusAdapter = createEventBusAdapter(eventBus);

interface TaskInstanceDb {
  taskInstance: PrismaClient['taskInstance'];
}

export class TaskInstancePrismaRepository
  extends AggregateRepositoryBase<TaskInstance>
  implements ITaskInstanceRepository
{
  private readonly db: TaskInstanceDb;

  constructor(prisma: PrismaClient, eventBus?: IEventBus);
  constructor(prisma: TaskInstanceDb, eventBus?: IEventBus);
  constructor(prisma: TaskInstanceDb | PrismaClient, eventBus: IEventBus = eventBusAdapter) {
    super(eventBus);
    this.db = prisma;
  }

  /**
   * Prisma record -> TaskInstance 聚合根
   */
  private mapToEntity(data: PrismaTaskInstance): TaskInstance {
    return PrismaTaskInstanceMapper.toDomain(data);
  }

  /**
   * TaskInstance 聚合根 -> Prisma write data
   */
  private toWriteData(instance: TaskInstance) {
    return PrismaTaskInstanceMapper.toPersistence(instance);
  }

  /**
   * Protected persistence method - called by base class before event publishing
   */
  protected async persist(instance: TaskInstance): Promise<void> {
    const data = this.toWriteData(instance);

    await this.db.taskInstance.upsert({
      where: { id: instance.id },
      create: {
        id: instance.id,
        ...data,
        createdAt: new Date(instance.createdAt),
      },
      update: data,
    });
  }

  /**
   * Persist instances sequentially on the bound client.
   *
   * Never open a nested `$transaction` here. When this repository is constructed
   * with an interactive transaction client (`tx`), that client may still expose
   * `$transaction`. A nested/batch transaction cannot see uncommitted rows from
   * the outer interactive transaction (e.g. template insert before instance
   * insert → P2003 on `task_instances_template_id_fkey`).
   */
  async saveMany(instances: TaskInstance[]): Promise<void> {
    for (const instance of instances) {
      await this.persist(instance);
    }
  }

  async findById(id: string): Promise<TaskInstance | null> {
    const data = await this.db.taskInstance.findUnique({
      where: { id },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findByIdForIdentity(identityId: string, id: string): Promise<TaskInstance | null> {
    const data = await this.db.taskInstance.findFirst({
      where: { id, identityId },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findByTemplateId(templateId: string, identityId: string): Promise<TaskInstance[]> {
    const data = await this.db.taskInstance.findMany({
      where: { templateId, identityId, deletedAt: null },
      orderBy: { instanceDate: 'desc' },
    });
    return data.map((record: PrismaTaskInstance) => this.mapToEntity(record));
  }

  async findByIdentityId(identityId: string): Promise<TaskInstance[]> {
    const data = await this.db.taskInstance.findMany({
      where: { identityId, deletedAt: null },
      orderBy: { instanceDate: 'desc' },
    });
    return data.map((record: PrismaTaskInstance) => this.mapToEntity(record));
  }

  async findByDateRange(
    identityId: string,
    startDate: number,
    endDate: number,
  ): Promise<TaskInstance[]> {
    const data = await this.db.taskInstance.findMany({
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
    return data.map((record: PrismaTaskInstance) => this.mapToEntity(record));
  }

  async findByStatus(identityId: string, status: TaskInstanceStatus): Promise<TaskInstance[]> {
    const data = await this.db.taskInstance.findMany({
      where: { identityId, status, deletedAt: null },
      orderBy: { instanceDate: 'desc' },
    });
    return data.map((record: PrismaTaskInstance) => this.mapToEntity(record));
  }

  async findOverdueInstances(identityId: string): Promise<TaskInstance[]> {
    const now = new Date();
    const data = await this.db.taskInstance.findMany({
      where: {
        identityId,
        status: 'Pending',
        instanceDate: { lt: now },
        deletedAt: null,
      },
      orderBy: { instanceDate: 'asc' },
    });
    return data.map((record: PrismaTaskInstance) => this.mapToEntity(record));
  }

  async delete(identityId: string, id: string): Promise<void> {
    const deleted = await this.db.taskInstance.deleteMany({
      where: { id, identityId },
    });
    if (deleted.count !== 1) {
      throw new Error('Task instance not found for the current identity.');
    }
  }

  async deleteMany(ids: string[]): Promise<void> {
    await this.db.taskInstance.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async deleteByTemplateId(templateId: string, identityId: string): Promise<void> {
    await this.db.taskInstance.deleteMany({
      where: { templateId, identityId },
    });
  }

  async countFutureInstances(
    templateId: string,
    identityId: string,
    fromDate: number = Date.now(),
  ): Promise<number> {
    return this.db.taskInstance.count({
      where: {
        templateId,
        identityId,
        instanceDate: { gte: new Date(fromDate) },
      },
    });
  }

  async findByTemplateIdAndDateRange(
    templateId: string,
    identityId: string,
    startDate: number,
    endDate: number,
  ): Promise<TaskInstance[]> {
    const data = await this.db.taskInstance.findMany({
      where: {
        templateId,
        identityId,
        instanceDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        deletedAt: null,
      },
      orderBy: { instanceDate: 'asc' },
    });
    return data.map((record: PrismaTaskInstance) => this.mapToEntity(record));
  }

  async getTemplateStats(
    templateIds: string[],
    identityId: string,
  ): Promise<Record<string, TaskTemplateInstanceStats>> {
    if (templateIds.length === 0) {
      return {};
    }

    const grouped = await this.db.taskInstance.groupBy({
      by: ['templateId', 'status'],
      where: {
        templateId: { in: templateIds },
        identityId,
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

  async deleteIncompleteInstancesFrom(
    templateId: string,
    identityId: string,
    fromDate: number,
  ): Promise<number> {
    const result = await this.db.taskInstance.deleteMany({
      where: {
        templateId,
        identityId,
        instanceDate: { gte: new Date(fromDate) },
        status: { in: ['Pending', 'InProgress'] },
      },
    });
    return result.count;
  }
}
