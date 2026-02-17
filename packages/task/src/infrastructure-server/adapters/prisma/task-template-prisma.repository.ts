/**
 * TaskTemplatePrismaRepository - Prisma Implementation of ITaskTemplateRepository
 * 任务模板仓储 - Prisma 实现
 *
 * 聚合根：TaskTemplate
 * 
 * Extends AggregateRepositoryBase to automatically publish domain events after persistence.
 */

import type { PrismaClient } from '@dailyuse/database';
import { TaskTemplate } from '../../../domain-server/aggregates/task-template';
import type {
  ITaskTemplateRepository,
  TaskFilters,
} from '../../../domain-server/repositories/ITaskTemplateRepository';
import type { TaskTemplateStatus } from '@dailyuse/contracts/task';
import { AggregateRepositoryBase, type IEventBus } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils';

/**
 * 全局 EventBus 适配器
 */
const eventBusAdapter: IEventBus = {
  async publish(event) {
    eventBus.send(event.eventType as any, event.payload);
  },
  async send(eventType, payload) {
    eventBus.send(eventType as any, payload);
  },
};

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
  private mapToEntity(data: any): TaskTemplate {
    return TaskTemplate.fromPersistenceDTO({
      id: data.id,
      identityId: data.identityId,
      name: data.name,
      description: data.description,
      timeConfigType: data.timeConfigType,
      timeConfigStartTime: data.timeConfigStartTime ?? null,
      timeConfigEndTime: data.timeConfigEndTime ?? null,
      timeConfigDurationMinutes: data.timeConfigDurationMinutes,
      recurrenceRuleType: data.recurrenceRuleType,
      recurrenceRuleInterval: data.recurrenceRuleInterval,
      recurrenceRuleDaysOfWeek: data.recurrenceRuleDaysOfWeek,
      recurrenceRuleDayOfMonth: data.recurrenceRuleDayOfMonth,
      recurrenceRuleMonthOfYear: data.recurrenceRuleMonthOfYear,
      recurrenceRuleEndDate: data.recurrenceRuleEndDate ?? null,
      recurrenceRuleCount: data.recurrenceRuleCount,
      reminderConfigEnabled: data.reminderConfigEnabled,
      reminderConfigTimeOffsetMinutes: data.reminderConfigTimeOffsetMinutes,
      reminderConfigUnit: data.reminderConfigUnit,
      reminderConfigChannel: data.reminderConfigChannel,
      lastGeneratedDate: data.lastGeneratedDate ?? null,
      generateAheadDays: data.generateAheadDays,
      importance: data.importance,
      tags: data.tags,
      color: data.color,
      status: data.status,
      goalBinding: data.goalBinding ? JSON.parse(data.goalBinding) : null,
      parentTaskId: data.parentTaskId,
      dependencyStatus: data.dependencyStatus,
      isBlocked: data.isBlocked,
      blockingReason: data.blockingReason,
      folderId: data.folderId,
      version: data.version,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? null,
    });
  }

  /**
   * TaskTemplate 聚合根  Prisma upsert data
   */
  private toWriteData(dto: ReturnType<TaskTemplate['toPersistenceDTO']>) {
    return {
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description,
      status: dto.status,
      importance: dto.importance,
      color: dto.color,
      tags: dto.tags,
      folderId: dto.folderId,
      parentTaskId: dto.parentTaskId,
      timeConfigType: dto.timeConfigType,
      timeConfigStartTime: dto.timeConfigStartTime
        ? new Date(dto.timeConfigStartTime as any)
        : null,
      timeConfigEndTime: dto.timeConfigEndTime
        ? new Date(dto.timeConfigEndTime as any)
        : null,
      timeConfigDurationMinutes: dto.timeConfigDurationMinutes,
      recurrenceRuleType: dto.recurrenceRuleType,
      recurrenceRuleInterval: dto.recurrenceRuleInterval,
      recurrenceRuleDaysOfWeek: dto.recurrenceRuleDaysOfWeek,
      recurrenceRuleDayOfMonth: dto.recurrenceRuleDayOfMonth,
      recurrenceRuleMonthOfYear: dto.recurrenceRuleMonthOfYear,
      recurrenceRuleEndDate: dto.recurrenceRuleEndDate
        ? new Date(dto.recurrenceRuleEndDate as any)
        : null,
      recurrenceRuleCount: dto.recurrenceRuleCount,
      reminderConfigEnabled: dto.reminderConfigEnabled,
      reminderConfigTimeOffsetMinutes: dto.reminderConfigTimeOffsetMinutes,
      reminderConfigUnit: dto.reminderConfigUnit,
      reminderConfigChannel: dto.reminderConfigChannel,
      lastGeneratedDate: dto.lastGeneratedDate
        ? new Date(dto.lastGeneratedDate as any)
        : null,
      generateAheadDays: dto.generateAheadDays,
      goalBinding: dto.goalBinding ? JSON.stringify(dto.goalBinding) : null,
      blockingReason: dto.blockingReason,
      dependencyStatus: dto.dependencyStatus ?? 'NONE',
      isBlocked: dto.isBlocked ?? false,
      version: dto.version,
    };
  }

  /**
   * Protected persistence method - called by base class before event publishing
   */
  protected async persist(template: TaskTemplate): Promise<void> {
    const dto = template.toPersistenceDTO();
    const data = this.toWriteData(dto);

    await this.prisma.taskTemplate.upsert({
      where: { id: dto.id },
      create: {
        id: dto.id,
        ...data,
        createdAt: dto.createdAt instanceof Date ? dto.createdAt : new Date(dto.createdAt),
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
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findByStatus(
    identityId: string,
    status: TaskTemplateStatus,
  ): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: { identityId, status, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
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
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findByFolderId(folderId: string): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: { folderId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
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
      .filter((d: any) => {
        try {
          const binding = JSON.parse(d.goalBinding || '{}');
          return binding.goalId === goalId;
        } catch {
          return false;
        }
      })
      .map((d: any) => this.mapToEntity(d));
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
      .filter((d: any) => {
        try {
          const rowTags = JSON.parse(d.tags || '[]');
          return tags.some((t) => rowTags.includes(t));
        } catch {
          return false;
        }
      })
      .map((d: any) => this.mapToEntity(d));
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
    return data.map((d: any) => this.mapToEntity(d));
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
    return data.map((d: any) => this.mapToEntity(d));
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
    return data.map((d: any) => this.mapToEntity(d));
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
      .map((d: any) => this.mapToEntity(d))
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
      .filter((d: any) => {
        try {
          const binding = JSON.parse(d.goalBinding || '{}');
          return binding.keyResultId === keyResultId;
        } catch {
          return false;
        }
      })
      .map((d: any) => this.mapToEntity(d));
  }

  async findSubtasks(parentTaskId: string): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: { parentTaskId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findBlockedTasks(identityId: string): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: {
        identityId,
        isBlocked: true,
        deletedAt: null,
      },
    });
    return data.map((d: any) => this.mapToEntity(d));
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
    return data.map((d: any) => this.mapToEntity(d));
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
    return data.map((d: any) => this.mapToEntity(d));
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
      const dto = template.toPersistenceDTO();
      const data = this.toWriteData(dto);
      return this.prisma.taskTemplate.upsert({
        where: { id: dto.id },
        create: {
          id: dto.id,
          ...data,
          createdAt: dto.createdAt instanceof Date ? dto.createdAt : new Date(dto.createdAt),
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