/**
 * TaskInstancePrismaRepository - Prisma Implementation of ITaskInstanceRepository
 * 任务实例仓储 - Prisma 实现
 *
 * 聚合根：TaskInstance
 */

import type { PrismaClient, TaskInstance as PrismaTaskInstance } from '@memoflow/database';
import { TaskInstance } from '../../../domain/aggregates/task-instance';
import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type { TaskTemplateInstanceStats } from '../../../domain/repositories/i-task-instance-repository';
import type { TaskInstanceStatus } from '@memoflow/contracts/task';
import {
  AggregateRepositoryBase,
  createEventBusAdapter,
  type IEventBus,
} from '@memoflow/patterns';
import { eventBus } from '@memoflow/utils/domain';
import { PrismaTaskInstanceMapper } from './mappers/prisma-task-instance-mapper';
import { OptimisticConcurrencyError } from '../../../domain/errors/optimistic-concurrency.error';

const eventBusAdapter = createEventBusAdapter(eventBus);

interface TaskInstanceDb {
  taskInstance: PrismaClient['taskInstance'];
}


/**
 * R2-1：识别 occurrenceKey 唯一约束冲突（P2002, target 含 occurrence_key）。
 * 幂等跳过条件——并发宿主已生成同一模板同一天的实例。
 */
function isOccurrenceKeyUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const e = error as { code?: string; meta?: { target?: unknown } };
  if (e.code !== 'P2002') return false;
  const target = e.meta?.target;
  return Array.isArray(target) && target.some((t) => String(t).includes('occurrence_key'));
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
   *
   * R2-5a：乐观锁——已存在实例必须匹配 `version: instance.version - 1`
   * （调用方读到的是旧版本），否则说明并发修改，抛 OptimisticConcurrencyError；
   * 不存在则走 create（新建实例 version=1）。
   */
  protected async persist(instance: TaskInstance): Promise<void> {
    const data = this.toWriteData(instance);

    const updated = await this.db.taskInstance.updateMany({
      where: { id: instance.id, version: instance.version - 1 },
      data,
    });

    if (updated.count === 0) {
      const existing = await this.db.taskInstance.findUnique({
        where: { id: instance.id },
        select: { id: true, version: true },
      });
      if (existing) {
        throw new OptimisticConcurrencyError(
          'TaskInstance',
          String(instance.id),
          instance.version - 1,
          existing.version,
        );
      }
      try {
        await this.db.taskInstance.create({
          data: {
            id: instance.id,
            ...data,
            createdAt: new Date(instance.createdAt),
          },
        });
      } catch (error) {
        // R2-1 幂等：saveMany 已在事务内先查重（见 saveMany），此处仍冲突
        // 属于真正并发窗口，原样抛出（不在事务内 catch 后查询，避免
        // "current transaction is aborted" 恶化错误）。
        throw error;
      }
    }
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
      // R2-1 幂等：同 (template_id, occurrence_key) 的实例已被并发宿主创建时
      // （create 的 generateInitialInstances 与 maintenance worker 竞态），
      // 事务内先查重并跳过，避免 create 撞唯一约束使事务 aborted。
      if (instance.occurrenceKey) {
        const existing = await this.db.taskInstance.findFirst({
          where: {
            templateId: String(instance.templateId),
            occurrenceKey: instance.occurrenceKey,
          },
          select: { id: true },
        });
        if (existing) {
          // 同 id = 内容更新（applyPlanProjection 等），走 persist 的版本化 update；
          // 不同 id = 并发宿主已生成同一实例，幂等跳过。
          if (String(existing.id) === String(instance.id)) {
            await this.persist(instance);
          }
          continue;
        }
      }
      await this.persist(instance);
    }
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

  async deleteMany(identityId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.db.taskInstance.deleteMany({
      where: { id: { in: ids }, identityId },
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
    asOf: number = Date.now(),
  ): Promise<Record<string, TaskTemplateInstanceStats>> {
    if (templateIds.length === 0) {
      return {};
    }

    const completionWindowDays = 30 as const;
    const windowStart = new Date(asOf - completionWindowDays * 24 * 60 * 60 * 1000);
    const windowEnd = new Date(asOf);
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
    const dueGrouped = await this.db.taskInstance.groupBy({
      by: ['templateId', 'status'],
      where: {
        templateId: { in: templateIds },
        identityId,
        instanceDate: { gte: windowStart, lte: windowEnd },
        deletedAt: null,
      },
      _count: {
        _all: true,
      },
    });
    const futurePendingGrouped = await this.db.taskInstance.groupBy({
      by: ['templateId'],
      where: {
        templateId: { in: templateIds },
        identityId,
        status: 'Pending',
        instanceDate: { gt: windowEnd },
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
        dueInstanceCount: 0,
        completedDueInstanceCount: 0,
        completionWindowDays,
        futurePendingInstanceCount: 0,
        singleInstanceStatus: null,
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

    for (const row of dueGrouped) {
      const stat = stats[row.templateId];
      if (!stat) {
        continue;
      }

      const count = row._count._all;
      stat.dueInstanceCount += count;
      if (row.status === 'Completed') {
        stat.completedDueInstanceCount += count;
      }
    }

    for (const row of futurePendingGrouped) {
      const stat = stats[row.templateId];
      if (stat) {
        stat.futurePendingInstanceCount = row._count._all;
      }
    }

    for (const stat of Object.values(stats)) {
      if (stat.instanceCount === 1) {
        stat.singleInstanceStatus =
          (grouped.find(
            (row) => row.templateId === stat.templateId && row._count._all === 1,
          )?.status as TaskInstanceStatus | undefined) ?? null;
      }
      stat.completionRate =
        stat.dueInstanceCount > 0
          ? Math.round((stat.completedDueInstanceCount / stat.dueInstanceCount) * 100)
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
