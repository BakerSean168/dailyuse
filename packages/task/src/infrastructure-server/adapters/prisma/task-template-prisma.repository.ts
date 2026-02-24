/**
 * TaskTemplatePrismaRepository - Prisma Implementation of ITaskTemplateRepository
 * 任务模板仓储 - Prisma 实现
 *
 * 聚合根：TaskTemplate
 * 
 * Extends AggregateRepositoryBase to automatically publish domain events after persistence.
 */

import type { PrismaClient, TaskTemplate as PrismaTaskTemplate } from '@dailyuse/database';
import { TaskTemplate } from '@/domain-server/aggregates/task-template';
import type {
  ITaskTemplateRepository,
  TaskFilters,
} from '@/domain-server/repositories/ITaskTemplateRepository';
import type { TaskTemplateStatus } from '@dailyuse/contracts/task';
import { AggregateRepositoryBase, createEventBusAdapter } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils';
import { PrismaTaskTemplateMapper } from './mappers/prisma-task-template-mapper';

const eventBusAdapter = createEventBusAdapter(eventBus);

export class TaskTemplatePrismaRepository
  extends AggregateRepositoryBase<TaskTemplate>
  implements ITaskTemplateRepository
{
  constructor(private prisma: PrismaClient) {
    super(eventBusAdapter);
  }

  /**
   * Prisma record  TaskTemplate 聚合根
   */
  private mapToEntity(data: PrismaTaskTemplate): TaskTemplate {
    return PrismaTaskTemplateMapper.toDomain(data);
  }

  /**
   * TaskTemplate 聚合根  Prisma upsert data
   */
  private toWriteData(dto: ReturnType<TaskTemplate['toServerDTO']>) {
    return PrismaTaskTemplateMapper.toPersistence(dto);
  }

  /**
   * Protected persistence method - called by base class before event publishing
   */
  protected async persist(template: TaskTemplate): Promise<void> {
    const dto = template.toServerDTO();
    const data = this.toWriteData(dto);

    await this.prisma.taskTemplate.upsert({
      where: { id: dto.id },
      create: {
        id: dto.id,
        ...data,
        createdAt: new Date(dto.createdAt),
      },
      update: data,
    });
  }

  async findById(id: string): Promise<TaskTemplate | null> {
    const data = await this.prisma.taskTemplate.findUnique({
      where: { id },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findByIdWithChildren(id: string): Promise<TaskTemplate | null> {
    const data = await this.prisma.taskTemplate.findUnique({
      where: { id },
      include: { subtasks: true, instances: true },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findByIdentityId(identityId: string): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: { identityId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: PrismaTaskTemplate) => this.mapToEntity(d));
  }

  async findByStatus(
    identityId: string,
    status: TaskTemplateStatus,
  ): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: { identityId, status, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: PrismaTaskTemplate) => this.mapToEntity(d));
  }

  async findActiveTemplates(identityId: string): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: {
        identityId,
        status: 'Active',
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: PrismaTaskTemplate) => this.mapToEntity(d));
  }

  async findByFolderId(folderId: string): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: { folderId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: PrismaTaskTemplate) => this.mapToEntity(d));
  }

  async findByGoalId(goalId: string): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: {
        goalBinding: { not: null },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    return data
      .filter((d: PrismaTaskTemplate) => {
        try {
          const binding = JSON.parse(d.goalBinding || '{}');
          return binding.goalId === goalId;
        } catch {
          return false;
        }
      })
      .map((d: PrismaTaskTemplate) => this.mapToEntity(d));
  }

  async findByTags(
    identityId: string,
    tags: string[],
  ): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: { identityId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return data
      .filter((d: PrismaTaskTemplate) => {
        try {
          const rowTags = JSON.parse(d.tags || '[]');
          return tags.some((t) => rowTags.includes(t));
        } catch {
          return false;
        }
      })
      .map((d: PrismaTaskTemplate) => this.mapToEntity(d));
  }

  async findNeedGenerateInstances(toDate: number): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: {
        recurrenceRuleType: { not: null },
        status: 'Active',
        deletedAt: null,
        OR: [
          { lastGeneratedDate: null },
          { lastGeneratedDate: { lt: new Date(toDate) } },
        ],
      },
    });
    return data.map((d: PrismaTaskTemplate) => this.mapToEntity(d));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.taskTemplate.delete({ where: { id } });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.taskTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string): Promise<void> {
    await this.prisma.taskTemplate.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async findOneTimeTasks(
    identityId: string,
    filters?: TaskFilters,
  ): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: {
        identityId,
        recurrenceRuleType: null,
        deletedAt: null,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.folderId ? { folderId: filters.folderId } : {}),
      },
      take: filters?.limit,
      skip: filters?.offset,
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: PrismaTaskTemplate) => this.mapToEntity(d));
  }

  async findRecurringTasks(
    identityId: string,
    filters?: TaskFilters,
  ): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: {
        identityId,
        recurrenceRuleType: { not: null },
        deletedAt: null,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.folderId ? { folderId: filters.folderId } : {}),
      },
      take: filters?.limit,
      skip: filters?.offset,
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: PrismaTaskTemplate) => this.mapToEntity(d));
  }

  async findOverdueTasks(identityId: string): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: {
        identityId,
        status: 'Active',
        deletedAt: null,
      },
    });
    return data
      .map((d: PrismaTaskTemplate) => this.mapToEntity(d))
      .filter((t) => t.isOverdue());
  }

  async findByKeyResultId(keyResultId: string): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: {
        goalBinding: { not: null },
        deletedAt: null,
      },
    });
    return data
      .filter((d: PrismaTaskTemplate) => {
        try {
          const binding = JSON.parse(d.goalBinding || '{}');
          return binding.keyResultId === keyResultId;
        } catch {
          return false;
        }
      })
      .map((d: PrismaTaskTemplate) => this.mapToEntity(d));
  }

  async findSubtasks(parentTaskId: string): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: { parentTaskId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return data.map((d: PrismaTaskTemplate) => this.mapToEntity(d));
  }

  async findBlockedTasks(identityId: string): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: {
        identityId,
        isBlocked: true,
        deletedAt: null,
      },
    });
    return data.map((d: PrismaTaskTemplate) => this.mapToEntity(d));
  }

  async findSortedByPriority(
    identityId: string,
    limit?: number,
  ): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: {
        identityId,
        status: 'Active',
        deletedAt: null,
      },
      orderBy: { importance: 'asc' },
      take: limit,
    });
    return data.map((d: PrismaTaskTemplate) => this.mapToEntity(d));
  }

  async findUpcomingTasks(
    identityId: string,
    daysAhead: number,
  ): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: {
        identityId,
        status: 'Active',
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: PrismaTaskTemplate) => this.mapToEntity(d));
  }

  async findTodayTasks(identityId: string): Promise<TaskTemplate[]> {
    return this.findUpcomingTasks(identityId, 1);
  }

  async countTasks(
    identityId: string,
    filters?: TaskFilters,
  ): Promise<number> {
    return this.prisma.taskTemplate.count({
      where: {
        identityId,
        deletedAt: null,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.folderId ? { folderId: filters.folderId } : {}),
      },
    });
  }

  async saveBatch(templates: TaskTemplate[]): Promise<void> {
    const operations = templates.map((template) => {
      const dto = template.toServerDTO();
      const data = this.toWriteData(dto);
      return this.prisma.taskTemplate.upsert({
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

  async deleteBatch(ids: string[]): Promise<void> {
    await this.prisma.taskTemplate.deleteMany({
      where: { id: { in: ids } },
    });
  }
}