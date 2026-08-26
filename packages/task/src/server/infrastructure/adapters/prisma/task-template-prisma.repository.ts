/**
 * TaskTemplatePrismaRepository - Prisma Implementation of ITaskTemplateRepository
 * 任务模板仓储 - Prisma 实现
 *
 * 聚合根：TaskTemplate
 *
 * Extends AggregateRepositoryBase to automatically publish domain events after persistence.
 */

import type { PrismaClient, TaskTemplate as PrismaTaskTemplate } from '@memoflow/database';
import { TaskTemplate } from '../../../domain/aggregates/task-template';
import type { ITaskTemplateRepository } from '../../../domain/repositories/i-task-template-repository';
import type { TaskFilters } from '../../../domain/repositories/i-task-template-repository';
import type { TaskTemplateStatus } from '@memoflow/contracts/task';
import {
  AggregateRepositoryBase,
  createEventBusAdapter,
  type IEventBus,
} from '@memoflow/patterns';
import { eventBus } from '@memoflow/utils/domain';
import { PrismaTaskTemplateMapper } from './mappers/prisma-task-template-mapper';
import { OptimisticConcurrencyError } from '../../../domain/errors/optimistic-concurrency.error';

const eventBusAdapter = createEventBusAdapter(eventBus);

interface TaskTemplateDb {
  taskTemplate: PrismaClient['taskTemplate'];
}

export class TaskTemplatePrismaRepository
  extends AggregateRepositoryBase<TaskTemplate>
  implements ITaskTemplateRepository
{
  private readonly db: TaskTemplateDb;

  constructor(prisma: PrismaClient, eventBus?: IEventBus);
  constructor(prisma: TaskTemplateDb, eventBus?: IEventBus);
  constructor(prisma: TaskTemplateDb | PrismaClient, eventBus: IEventBus = eventBusAdapter) {
    super(eventBus);
    this.db = prisma;
  }

  /**
   * Prisma record -> TaskTemplate 聚合根
   */
  private mapToEntity(data: PrismaTaskTemplate): TaskTemplate {
    return PrismaTaskTemplateMapper.toDomain(data);
  }

  /**
   * TaskTemplate 聚合根 -> Prisma write data
   */
  private toWriteData(template: TaskTemplate) {
    return PrismaTaskTemplateMapper.toPersistence(template);
  }

  /**
   * Protected persistence method - called by base class before event publishing
   *
   * R2-5a：乐观锁——已存在模板必须匹配 `version: template.version - 1`，
   * 否则并发修改抛 OptimisticConcurrencyError；不存在则 create。
   */
  protected async persist(template: TaskTemplate): Promise<void> {
    const data = this.toWriteData(template);

    const updated = await this.db.taskTemplate.updateMany({
      where: { id: template.id, version: template.version - 1 },
      data,
    });

    if (updated.count === 0) {
      const existing = await this.db.taskTemplate.findUnique({
        where: { id: template.id },
        select: { id: true, version: true },
      });
      if (existing) {
        throw new OptimisticConcurrencyError(
          'TaskTemplate',
          String(template.id),
          template.version - 1,
          existing.version,
        );
      }
      await this.db.taskTemplate.create({
        data: {
          id: template.id,
          ...data,
          createdAt: new Date(template.createdAt),
        },
      });
    }
  }

  async findByIdForIdentity(identityId: string, id: string): Promise<TaskTemplate | null> {
    const data = await this.db.taskTemplate.findFirst({
      where: { id, identityId },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findByIdWithChildren(identityId: string, id: string): Promise<TaskTemplate | null> {
    const data = await this.db.taskTemplate.findFirst({
      where: { id, identityId },
      include: { instances: true },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findByIdentityId(identityId: string): Promise<TaskTemplate[]> {
    const data = await this.db.taskTemplate.findMany({
      where: { identityId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((record: PrismaTaskTemplate) => this.mapToEntity(record));
  }

  async findByStatus(
    identityId: string,
    status: TaskTemplateStatus,
  ): Promise<TaskTemplate[]> {
    const data = await this.db.taskTemplate.findMany({
      where: { identityId, status, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((record: PrismaTaskTemplate) => this.mapToEntity(record));
  }

  async findActiveTemplates(identityId: string): Promise<TaskTemplate[]> {
    const data = await this.db.taskTemplate.findMany({
      where: {
        identityId,
        status: 'Active',
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((record: PrismaTaskTemplate) => this.mapToEntity(record));
  }


  async findByGoalId(identityId: string, goalId: string): Promise<TaskTemplate[]> {
    const data = await this.db.taskTemplate.findMany({
      where: {
        identityId,
        goalId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((record: PrismaTaskTemplate) => this.mapToEntity(record));
  }

  async findByTags(identityId: string, tags: string[]): Promise<TaskTemplate[]> {
    const data = await this.db.taskTemplate.findMany({
      where: { identityId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return data
      .filter((record: PrismaTaskTemplate) => {
        try {
          const rowTags = JSON.parse(record.tags || '[]');
          return tags.some((tag) => rowTags.includes(tag));
        } catch {
          return false;
        }
      })
      .map((record: PrismaTaskTemplate) => this.mapToEntity(record));
  }

  async findAllTemplateRefs(): Promise<Array<{ id: string; identityId: string }>> {
    const rows = await this.db.taskTemplate.findMany({
      select: { id: true, identityId: true },
    });
    return rows.map((row) => ({ id: row.id, identityId: row.identityId }));
  }

  async findNeedGenerateInstances(toDate: number): Promise<TaskTemplate[]> {
    const data = await this.db.taskTemplate.findMany({
      where: {
        recurrenceRuleType: { not: null },
        status: 'Active',
        deletedAt: null,
        OR: [{ lastGeneratedDate: null }, { lastGeneratedDate: { lt: new Date(toDate) } }],
      },
    });
    return data.map((record: PrismaTaskTemplate) => this.mapToEntity(record));
  }

  async delete(identityId: string, id: string): Promise<void> {
    const deleted = await this.db.taskTemplate.deleteMany({
      where: { id, identityId },
    });
    if (deleted.count !== 1) {
      throw new Error('Task template not found for the current identity.');
    }
  }

  async softDelete(identityId: string, id: string): Promise<void> {
    const result = await this.db.taskTemplate.updateMany({
      where: { id, identityId },
      data: { deletedAt: new Date() },
    });
    if (result.count !== 1) {
      throw new Error('Task template not found for the current identity.');
    }
  }

  async restore(identityId: string, id: string): Promise<void> {
    const result = await this.db.taskTemplate.updateMany({
      where: { id, identityId },
      data: { deletedAt: null },
    });
    if (result.count !== 1) {
      throw new Error('Task template not found for the current identity.');
    }
  }

  async findOneTimeTasks(identityId: string, filters?: TaskFilters): Promise<TaskTemplate[]> {
    const data = await this.db.taskTemplate.findMany({
      where: {
        identityId,
        recurrenceRuleType: null,
        deletedAt: null,
        ...(filters?.status ? { status: filters.status } : {}),
      },
      take: filters?.limit,
      skip: filters?.offset,
      orderBy: { createdAt: 'desc' },
    });
    return data.map((record: PrismaTaskTemplate) => this.mapToEntity(record));
  }

  async findRecurringTasks(identityId: string, filters?: TaskFilters): Promise<TaskTemplate[]> {
    const data = await this.db.taskTemplate.findMany({
      where: {
        identityId,
        recurrenceRuleType: { not: null },
        deletedAt: null,
        ...(filters?.status ? { status: filters.status } : {}),
      },
      take: filters?.limit,
      skip: filters?.offset,
      orderBy: { createdAt: 'desc' },
    });
    return data.map((record: PrismaTaskTemplate) => this.mapToEntity(record));
  }

  async findOverdueTasks(identityId: string): Promise<TaskTemplate[]> {
    const data = await this.db.taskTemplate.findMany({
      where: {
        identityId,
        status: 'Active',
        deletedAt: null,
      },
    });
    return data
      .map((record: PrismaTaskTemplate) => this.mapToEntity(record))
      .filter((template) => template.isOverdue());
  }

  async findByKeyResultId(identityId: string, keyResultId: string): Promise<TaskTemplate[]> {
    const data = await this.db.taskTemplate.findMany({
      where: {
        identityId,
        keyResultId,
        deletedAt: null,
      },
    });
    return data.map((record: PrismaTaskTemplate) => this.mapToEntity(record));
  }




  async findUpcomingTasks(identityId: string, _daysAhead: number): Promise<TaskTemplate[]> {
    const data = await this.db.taskTemplate.findMany({
      where: {
        identityId,
        status: 'Active',
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((record: PrismaTaskTemplate) => this.mapToEntity(record));
  }

  async findTodayTasks(identityId: string): Promise<TaskTemplate[]> {
    return this.findUpcomingTasks(identityId, 1);
  }

  async countTasks(identityId: string, filters?: TaskFilters): Promise<number> {
    return this.db.taskTemplate.count({
      where: {
        identityId,
        deletedAt: null,
        ...(filters?.status ? { status: filters.status } : {}),
      },
    });
  }

  /**
   * Persist templates sequentially on the bound client.
   * Avoid nested `$transaction` when already inside an interactive transaction.
   */
  async saveBatch(templates: TaskTemplate[]): Promise<void> {
    for (const template of templates) {
      await this.persist(template);
    }
  }

  async deleteBatch(identityId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.db.taskTemplate.deleteMany({
      where: { id: { in: ids }, identityId },
    });
  }
}
