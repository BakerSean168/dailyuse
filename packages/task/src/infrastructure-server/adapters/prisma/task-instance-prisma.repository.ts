/**
 * TaskInstancePrismaRepository - Prisma Implementation of ITaskInstanceRepository
 * 任务实例仓储 - Prisma 实现
 *
 * 聚合根：TaskInstance
 */

import type { PrismaClient } from '@dailyuse/database';
import { TaskInstance } from '../../../domain-server/aggregates/task-instance';
import type { ITaskInstanceRepository } from '../../../domain-server/repositories/ITaskInstanceRepository';
import type { TaskInstanceStatus } from '@dailyuse/contracts/task';

export class TaskInstancePrismaRepository implements ITaskInstanceRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Prisma record  TaskInstance 聚合根
   */
  private mapToEntity(data: any): TaskInstance {
    return TaskInstance.fromPersistenceDTO({
      id: data.id,
      templateId: data.templateId,
      identityId: data.identityId,
      instanceDate: data.instanceDate,
      timeConfig: data.timeConfig || '{}',
      importance: data.importance || 'Moderate',
      priority: data.priority ?? undefined,
      status: data.status,
      actualStartTime: data.actualStartTime ?? null,
      actualEndTime: data.actualEndTime ?? null,
      comment: data.comment ?? null,
      version: data.version,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? null,
    });
  }

  /**
   * TaskInstance 聚合根  Prisma write data
   */
  private toWriteData(dto: ReturnType<TaskInstance['toPersistenceDTO']>) {
    return {
      templateId: dto.templateId,
      identityId: dto.identityId,
      instanceDate: dto.instanceDate instanceof Date ? dto.instanceDate : new Date(dto.instanceDate as any),
      timeConfig: dto.timeConfig || '{}',
      importance: dto.importance || 'Moderate',
      priority: dto.priority ?? null,
      status: dto.status,
      actualStartTime: dto.actualStartTime
        ? (dto.actualStartTime instanceof Date ? dto.actualStartTime : new Date(dto.actualStartTime as any))
        : null,
      actualEndTime: dto.actualEndTime
        ? (dto.actualEndTime instanceof Date ? dto.actualEndTime : new Date(dto.actualEndTime as any))
        : null,
      comment: dto.comment ?? null,
      version: dto.version,
    };
  }

  async save(instance: TaskInstance): Promise<void> {
    const dto = instance.toPersistenceDTO();
    const data = this.toWriteData(dto);

    await this.prisma.taskInstance.upsert({
      where: { id: dto.id },
      create: {
        id: dto.id,
        ...data,
        createdAt: dto.createdAt instanceof Date ? dto.createdAt : new Date(dto.createdAt as any),
      },
      update: data,
    });
  }

  async saveMany(instances: TaskInstance[]): Promise<void> {
    const operations = instances.map((instance) => {
      const dto = instance.toPersistenceDTO();
      const data = this.toWriteData(dto);
      return this.prisma.taskInstance.upsert({
        where: { id: dto.id },
        create: {
          id: dto.id,
          ...data,
          createdAt: dto.createdAt instanceof Date ? dto.createdAt : new Date(dto.createdAt as any),
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
      where: { templateId },
      orderBy: { instanceDate: 'desc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findByIdentityId(identityId: string): Promise<TaskInstance[]> {
    const data = await this.prisma.taskInstance.findMany({
      where: { identityId },
      orderBy: { instanceDate: 'desc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
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
      },
      orderBy: { instanceDate: 'asc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findByStatus(
    identityId: string,
    status: TaskInstanceStatus,
  ): Promise<TaskInstance[]> {
    const data = await this.prisma.taskInstance.findMany({
      where: { identityId, status },
      orderBy: { instanceDate: 'desc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findOverdueInstances(identityId: string): Promise<TaskInstance[]> {
    const now = new Date();
    const data = await this.prisma.taskInstance.findMany({
      where: {
        identityId,
        status: 'Pending',
        instanceDate: { lt: now },
      },
      orderBy: { instanceDate: 'asc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
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

  async countFutureInstances(
    templateId: string,
    fromDate: number = Date.now(),
  ): Promise<number> {
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
      },
      orderBy: { instanceDate: 'asc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async deleteFuturePendingInstances(
    templateId: string,
    fromDate: number,
  ): Promise<void> {
    await this.prisma.taskInstance.deleteMany({
      where: {
        templateId,
        instanceDate: { gte: new Date(fromDate) },
        status: 'Pending',
      },
    });
  }
}