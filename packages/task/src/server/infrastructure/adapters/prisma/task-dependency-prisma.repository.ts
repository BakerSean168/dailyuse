/**
 * TaskDependencyPrismaRepository - Prisma Implementation of ITaskDependencyRepository
 * 任务依赖关系仓储 - Prisma 实现
 *
 * 聚合根：TaskDependency
 */

import type { PrismaClient, TaskDependency as PrismaTaskDependency } from '@dailyuse/database';
import type { IdentityId } from '@dailyuse/domain-shared';
import type { ITaskDependencyRepository } from '../../../domain/repositories/i-task-dependency-repository';
import type { TaskDependencyServerDTO } from '@dailyuse/contracts/task';
import type { DependencyType } from '@dailyuse/contracts/task';
import { TaskDependency } from '../../../domain/aggregates/task-dependency';
import { PrismaTaskDependencyMapper } from './mappers/prisma-task-dependency-mapper';
import { createEventBusAdapter, publishAggregateEvents } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils/domain';

const eventBusAdapter = createEventBusAdapter(eventBus);

export class TaskDependencyPrismaRepository implements ITaskDependencyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Prisma record  TaskDependencyServerDTO
   */
  private mapToDTO(data: PrismaTaskDependency): TaskDependencyServerDTO {
    return PrismaTaskDependencyMapper.toDTO(data);
  }

  async create(data: {
    predecessorTaskId: string;
    successorTaskId: string;
    dependencyType?: DependencyType;
    lagDays?: number;
    identityId: string;
  }): Promise<TaskDependencyServerDTO> {
    const entity = TaskDependency.create({
      predecessorTaskId: data.predecessorTaskId,
      successorTaskId: data.successorTaskId,
      dependencyType: data.dependencyType,
      lagDays: data.lagDays,
      identityId: data.identityId as IdentityId,
    });
    const dto = entity.toServerDTO();

    const dependency = await this.prisma.taskDependency.create({
      data: {
        id: dto.id,
        identityId: dto.identityId,
        predecessorTaskId: dto.predecessorTaskId,
        successorTaskId: dto.successorTaskId,
        dependencyType: String(dto.dependencyType),
        lagDays: dto.lagDays ?? null,
        updatedAt: new Date(),
      },
    });

    return this.mapToDTO(dependency);
  }

  async findById(id: string): Promise<TaskDependencyServerDTO | null> {
    const dependency = await this.prisma.taskDependency.findUnique({
      where: { id },
    });
    return dependency ? this.mapToDTO(dependency) : null;
  }

  async findByIdForIdentity(
    identityId: string,
    id: string,
  ): Promise<TaskDependencyServerDTO | null> {
    const dependency = await this.prisma.taskDependency.findFirst({
      where: { id, identityId },
    });
    return dependency ? this.mapToDTO(dependency) : null;
  }

  async findBySuccessorId(
    taskId: string,
    identityId: string,
  ): Promise<TaskDependencyServerDTO[]> {
    const dependencies = await this.prisma.taskDependency.findMany({
      where: { successorTaskId: taskId, identityId },
      orderBy: { createdAt: 'asc' },
    });
    return dependencies.map((dep) => this.mapToDTO(dep));
  }

  async findByPredecessorId(
    taskId: string,
    identityId: string,
  ): Promise<TaskDependencyServerDTO[]> {
    const dependencies = await this.prisma.taskDependency.findMany({
      where: { predecessorTaskId: taskId, identityId },
      orderBy: { createdAt: 'asc' },
    });
    return dependencies.map((dep) => this.mapToDTO(dep));
  }

  async findByPredecessorAndSuccessorId(
    predecessorId: string,
    successorId: string,
    identityId: string,
  ): Promise<TaskDependencyServerDTO | null> {
    const dependency = await this.prisma.taskDependency.findFirst({
      where: {
        predecessorTaskId: predecessorId,
        successorTaskId: successorId,
        identityId,
      },
    });
    return dependency ? this.mapToDTO(dependency) : null;
  }

  /**
   * 递归查找所有前置任务（完整依赖链）
   */
  async findAllPredecessorIds(taskId: string, identityId: string): Promise<string[]> {
    const visited = new Set<string>();
    const result: string[] = [];
    await this.traversePredecessors(taskId, identityId, visited, result);
    return result;
  }

  private async traversePredecessors(
    taskId: string,
    identityId: string,
    visited: Set<string>,
    result: string[],
  ): Promise<void> {
    if (visited.has(taskId)) return;
    visited.add(taskId);

    const deps = await this.findBySuccessorId(taskId, identityId);
    for (const dep of deps) {
      if (!result.includes(dep.predecessorTaskId)) {
        result.push(dep.predecessorTaskId);
      }
      await this.traversePredecessors(dep.predecessorTaskId, identityId, visited, result);
    }
  }

  /**
   * 递归查找所有后续任务（完整依赖链）
   */
  async findAllSuccessorIds(taskId: string, identityId: string): Promise<string[]> {
    const visited = new Set<string>();
    const result: string[] = [];
    await this.traverseSuccessors(taskId, identityId, visited, result);
    return result;
  }

  private async traverseSuccessors(
    taskId: string,
    identityId: string,
    visited: Set<string>,
    result: string[],
  ): Promise<void> {
    if (visited.has(taskId)) return;
    visited.add(taskId);

    const deps = await this.findByPredecessorId(taskId, identityId);
    for (const dep of deps) {
      if (!result.includes(dep.successorTaskId)) {
        result.push(dep.successorTaskId);
      }
      await this.traverseSuccessors(dep.successorTaskId, identityId, visited, result);
    }
  }

  async delete(identityId: string, id: string): Promise<void> {
    const deleted = await this.prisma.taskDependency.deleteMany({
      where: { id, identityId },
    });
    if (deleted.count !== 1) {
      throw new Error('Task dependency not found for the current identity.');
    }
  }

  async deleteAggregate(dependency: TaskDependency): Promise<void> {
    const deleted = await this.prisma.taskDependency.deleteMany({
      where: { id: dependency.id, identityId: dependency.identityId },
    });
    if (deleted.count !== 1) {
      throw new Error('Task dependency not found for the current identity.');
    }
    await publishAggregateEvents(dependency, eventBusAdapter);
  }

  async findAggregateById(id: string): Promise<TaskDependency | null> {
    const data = await this.prisma.taskDependency.findUnique({ where: { id } });
    return data ? PrismaTaskDependencyMapper.toAggregate(data) : null;
  }

  async findAggregateByIdForIdentity(
    identityId: string,
    id: string,
  ): Promise<TaskDependency | null> {
    const data = await this.prisma.taskDependency.findFirst({
      where: { id, identityId },
    });
    return data ? PrismaTaskDependencyMapper.toAggregate(data) : null;
  }

  async deleteByTaskId(identityId: string, taskId: string): Promise<void> {
    await this.prisma.taskDependency.deleteMany({
      where: {
        identityId,
        OR: [{ predecessorTaskId: taskId }, { successorTaskId: taskId }],
      },
    });
  }

  async update(
    identityId: string,
    id: string,
    data: { dependencyType?: DependencyType; lagDays?: number },
  ): Promise<TaskDependencyServerDTO> {
    const updated = await this.prisma.taskDependency.updateMany({
      where: { id, identityId },
      data: {
        ...(data.dependencyType !== undefined
          ? { dependencyType: String(data.dependencyType) }
          : {}),
        ...(data.lagDays !== undefined ? { lagDays: data.lagDays } : {}),
      },
    });
    if (updated.count !== 1) {
      throw new Error('Task dependency not found for the current identity.');
    }
    const dependency = await this.prisma.taskDependency.findFirst({
      where: { id, identityId },
    });
    if (!dependency) {
      throw new Error('Task dependency not found for the current identity.');
    }
    return this.mapToDTO(dependency);
  }

  async findAllByIdentityId(identityId: string): Promise<TaskDependencyServerDTO[]> {
    const templates = await this.prisma.taskTemplate.findMany({
      where: { identityId },
      select: { id: true },
    });

    const templateIds = templates.map((t) => t.id);
    if (templateIds.length === 0) return [];

    const dependencies = await this.prisma.taskDependency.findMany({
      where: {
        OR: [{ predecessorTaskId: { in: templateIds } }, { successorTaskId: { in: templateIds } }],
      },
      orderBy: { createdAt: 'asc' },
    });

    return dependencies.map((dep) => this.mapToDTO(dep));
  }
}
