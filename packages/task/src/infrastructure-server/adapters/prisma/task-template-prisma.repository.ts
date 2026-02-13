/**
 * TaskTemplatePrismaRepository - Prisma Implementation of ITaskTemplateRepository
 * 任务模板仓储 - Prisma实现
 */

import type { PrismaClient } from '@dailyuse/database';
import { TaskTemplate } from '../../../domain-server/aggregates/task-template';
import type {
  ITaskTemplateRepository,
  TaskFilters,
} from '../../../domain-server/repositories/ITaskTemplateRepository';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';

export class TaskTemplatePrismaRepository implements ITaskTemplateRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToEntity(data: any): TaskTemplate {
    return TaskTemplate.fromPersistenceDTO({
      id: data.id,
      identityId: data.identityId,
      name: data.name,
      description: data.description,
      timeConfigType: data.timeConfigType,
      timeConfigStartTime: data.timeConfigStartTime
        ? data.timeConfigStartTime.getTime()
        : null,
      timeConfigEndTime: data.timeConfigEndTime
        ? data.timeConfigEndTime.getTime()
        : null,
      timeConfigDurationMinutes: data.timeConfigDurationMinutes,
      recurrenceRuleType: data.recurrenceRuleType,
      recurrenceRuleInterval: data.recurrenceRuleInterval,
      recurrenceRuleDaysOfWeek: data.recurrenceRuleDaysOfWeek,
      recurrenceRuleDayOfMonth: data.recurrenceRuleDayOfMonth,
      recurrenceRuleMonthOfYear: data.recurrenceRuleMonthOfYear,
      recurrenceRuleEndDate: data.recurrenceRuleEndDate
        ? data.recurrenceRuleEndDate.getTime()
        : null,
      recurrenceRuleCount: data.recurrenceRuleCount,
      reminderConfigEnabled: data.reminderConfigEnabled,
      reminderConfigTimeOffsetMinutes: data.reminderConfigTimeOffsetMinutes,
      reminderConfigUnit: data.reminderConfigUnit,
      reminderConfigChannel: data.reminderConfigChannel,
      lastGeneratedDate: data.lastGeneratedDate
        ? data.lastGeneratedDate.getTime()
        : null,
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
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
      deletedAt: data.deletedAt ? data.deletedAt.getTime() : null,
    });
  }

  async save(template: TaskTemplate): Promise<void> {
    const dto = template.toPersistenceDTO();
    const data = {
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
        ? new Date(dto.timeConfigStartTime)
        : null,
      timeConfigEndTime: dto.timeConfigEndTime
        ? new Date(dto.timeConfigEndTime)
        : null,
      timeConfigDurationMinutes: dto.timeConfigDurationMinutes,
      recurrenceRuleType: dto.recurrenceRuleType,
      recurrenceRuleInterval: dto.recurrenceRuleInterval,
      recurrenceRuleDaysOfWeek: dto.recurrenceRuleDaysOfWeek,
      recurrenceRuleDayOfMonth: dto.recurrenceRuleDayOfMonth,
      recurrenceRuleMonthOfYear: dto.recurrenceRuleMonthOfYear,
      recurrenceRuleEndDate: dto.recurrenceRuleEndDate
        ? new Date(dto.recurrenceRuleEndDate)
        : null,
      recurrenceRuleCount: dto.recurrenceRuleCount,
      reminderConfigEnabled: dto.reminderConfigEnabled,
      reminderConfigTimeOffsetMinutes: dto.reminderConfigTimeOffsetMinutes,
      reminderConfigUnit: dto.reminderConfigUnit,
      reminderConfigChannel: dto.reminderConfigChannel,
      lastGeneratedDate: dto.lastGeneratedDate
        ? new Date(dto.lastGeneratedDate)
        : null,
      generateAheadDays: dto.generateAheadDays,
      goalBinding: dto.goalBinding ? JSON.stringify(dto.goalBinding) : null,
      blockingReason: dto.blockingReason,
      dependencyStatus: dto.dependencyStatus ?? 'NONE',
      isBlocked: dto.isBlocked ?? false,
      version: dto.version,
    };

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

  async findByUuid(uuid: string): Promise<TaskTemplate | null> {
    const data = await this.prisma.taskTemplate.findUnique({
      where: { id: uuid },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findByUuidWithChildren(uuid: string): Promise<TaskTemplate | null> {
    const data = await this.prisma.taskTemplate.findUnique({
      where: { id: uuid },
      include: { subtasks: true, instances: true },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findByAccount(accountUuid: string): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: { identityId: accountUuid, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findByStatus(
    accountUuid: string,
    status: TaskTemplateStatus,
  ): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: { identityId: accountUuid, status, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findActiveTemplates(accountUuid: string): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: {
        identityId: accountUuid,
        status: { in: ['ACTIVE', 'IN_PROGRESS'] },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findByFolder(folderUuid: string): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: { folderId: folderUuid, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findByGoal(goalUuid: string): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: {
        goalBinding: { not: null },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    // Filter by goalId within the goalBinding JSON
    return data
      .filter((d: any) => {
        try {
          const binding = JSON.parse(d.goalBinding || '{}');
          return binding.goalId === goalUuid;
        } catch {
          return false;
        }
      })
      .map((d: any) => this.mapToEntity(d));
  }

  async findByTags(
    accountUuid: string,
    tags: string[],
  ): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: { identityId: accountUuid, deletedAt: null },
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
        status: { in: ['ACTIVE', 'IN_PROGRESS'] },
        deletedAt: null,
        OR: [
          { lastGeneratedDate: null },
          { lastGeneratedDate: { lt: new Date(toDate) } },
        ],
      },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.taskTemplate.delete({ where: { id: uuid } });
  }

  async softDelete(uuid: string): Promise<void> {
    await this.prisma.taskTemplate.update({
      where: { id: uuid },
      data: { deletedAt: new Date() },
    });
  }

  async restore(uuid: string): Promise<void> {
    await this.prisma.taskTemplate.update({
      where: { id: uuid },
      data: { deletedAt: null },
    });
  }

  async findOneTimeTasks(
    accountUuid: string,
    filters?: TaskFilters,
  ): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: {
        identityId: accountUuid,
        recurrenceRuleType: null,
        deletedAt: null,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.folderUuid ? { folderId: filters.folderUuid } : {}),
      },
      take: filters?.limit,
      skip: filters?.offset,
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findRecurringTasks(
    accountUuid: string,
    filters?: TaskFilters,
  ): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: {
        identityId: accountUuid,
        recurrenceRuleType: { not: null },
        deletedAt: null,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.folderUuid ? { folderId: filters.folderUuid } : {}),
      },
      take: filters?.limit,
      skip: filters?.offset,
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findOverdueTasks(accountUuid: string): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: {
        identityId: accountUuid,
        status: { in: ['ACTIVE', 'IN_PROGRESS'] },
        deletedAt: null,
      },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findTasksByGoal(goalUuid: string): Promise<TaskTemplate[]> {
    return this.findByGoal(goalUuid);
  }

  async findTasksByKeyResult(keyResultUuid: string): Promise<TaskTemplate[]> {
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
          return binding.keyResultId === keyResultUuid;
        } catch {
          return false;
        }
      })
      .map((d: any) => this.mapToEntity(d));
  }

  async findSubtasks(parentTaskUuid: string): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: { parentTaskId: parentTaskUuid, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findBlockedTasks(accountUuid: string): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: {
        identityId: accountUuid,
        isBlocked: true,
        deletedAt: null,
      },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findTasksSortedByPriority(
    accountUuid: string,
    limit?: number,
  ): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: {
        identityId: accountUuid,
        status: { in: ['ACTIVE', 'IN_PROGRESS'] },
        deletedAt: null,
      },
      orderBy: { importance: 'asc' },
      take: limit,
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findUpcomingTasks(
    accountUuid: string,
    daysAhead: number,
  ): Promise<TaskTemplate[]> {
    const data = await this.prisma.taskTemplate.findMany({
      where: {
        identityId: accountUuid,
        status: { in: ['ACTIVE', 'IN_PROGRESS'] },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findTodayTasks(accountUuid: string): Promise<TaskTemplate[]> {
    return this.findUpcomingTasks(accountUuid, 1);
  }

  async countTasks(
    accountUuid: string,
    filters?: TaskFilters,
  ): Promise<number> {
    return this.prisma.taskTemplate.count({
      where: {
        identityId: accountUuid,
        deletedAt: null,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.folderUuid ? { folderId: filters.folderUuid } : {}),
      },
    });
  }

  async saveBatch(templates: TaskTemplate[]): Promise<void> {
    const operations = templates.map((template) => {
      const dto = template.toPersistenceDTO();
      const data = {
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
          ? new Date(dto.timeConfigStartTime)
          : null,
        timeConfigEndTime: dto.timeConfigEndTime
          ? new Date(dto.timeConfigEndTime)
          : null,
        timeConfigDurationMinutes: dto.timeConfigDurationMinutes,
        recurrenceRuleType: dto.recurrenceRuleType,
        recurrenceRuleInterval: dto.recurrenceRuleInterval,
        recurrenceRuleDaysOfWeek: dto.recurrenceRuleDaysOfWeek,
        recurrenceRuleDayOfMonth: dto.recurrenceRuleDayOfMonth,
        recurrenceRuleMonthOfYear: dto.recurrenceRuleMonthOfYear,
        recurrenceRuleEndDate: dto.recurrenceRuleEndDate
          ? new Date(dto.recurrenceRuleEndDate)
          : null,
        recurrenceRuleCount: dto.recurrenceRuleCount,
        reminderConfigEnabled: dto.reminderConfigEnabled,
        reminderConfigTimeOffsetMinutes: dto.reminderConfigTimeOffsetMinutes,
        reminderConfigUnit: dto.reminderConfigUnit,
        reminderConfigChannel: dto.reminderConfigChannel,
        lastGeneratedDate: dto.lastGeneratedDate
          ? new Date(dto.lastGeneratedDate)
          : null,
        generateAheadDays: dto.generateAheadDays,
        goalBinding: dto.goalBinding ? JSON.stringify(dto.goalBinding) : null,
        blockingReason: dto.blockingReason,
        dependencyStatus: dto.dependencyStatus ?? 'NONE',
        isBlocked: dto.isBlocked ?? false,
        version: dto.version,
      };
      return this.prisma.taskTemplate.upsert({
        where: { id: dto.id },
        create: { id: dto.id, ...data, createdAt: new Date(dto.createdAt) },
        update: data,
      });
    });
    await this.prisma.$transaction(operations);
  }

  async deleteBatch(uuids: string[]): Promise<void> {
    await this.prisma.taskTemplate.deleteMany({
      where: { id: { in: uuids } },
    });
  }
}
