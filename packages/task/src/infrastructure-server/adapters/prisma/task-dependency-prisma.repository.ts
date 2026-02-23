/**
 * TaskDependencyPrismaRepository - Prisma Implementation of ITaskDependencyRepository
 * 任务依赖关系仓储 - Prisma 实现
 *
 * 聚合根：TaskDependency
 */

import type { PrismaClient, TaskDependency as PrismaTaskDependency } from '@dailyuse/database';
import type { ITaskDependencyRepository } from '@/domain-server/repositories/ITaskDependencyRepository';
import type { TaskDependencyServerDTO } from '@dailyuse/contracts/task';
import type { DependencyType } from '@dailyuse/contracts/task';
import { TaskDependency } from '@/domain-server/aggregates/task-dependency';
import { PrismaTaskDependencyMapper } from '../../mappers/prisma-task-dependency-mapper';

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
  }): Promise<TaskDependencyServerDTO> {
    const entity = TaskDependency.create({
      predecessorTaskId: data.predecessorTaskId,
      successorTaskId: data.successorTaskId,
      dependencyType: data.dependencyType,
      lagDays: data.lagDays,
    });
    const dto = entity.toServerDTO();

    const dependency = await this.prisma.taskDependency.create({
      data: {
        id: dto.id,
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

  async findBySuccessorId(taskId: string): Promise<TaskDependencyServerDTO[]> {
    const dependencies = await this.prisma.taskDependency.findMany({
      where: { successorTaskId: taskId },
      orderBy: { createdAt: 'asc' },
    });
    return dependencies.map((dep: any) => this.mapToDTO(dep));
  }

  async findByPredecessorId(taskId: string): Promise<TaskDependencyServerDTO[]> {
    const dependencies = await this.prisma.taskDependency.findMany({
      where: { predecessorTaskId: taskId },
      orderBy: { createdAt: 'asc' },
    });
    return dependencies.map((dep: any) => this.mapToDTO(dep));
  }

  async findByPredecessorAndSuccessorId(
    predecessorId: string,
    successorId: string,
  ): Promise<TaskDependencyServerDTO | null> {
    const dependency = await this.prisma.taskDependency.findFirst({
      where: {
        predecessorTaskId: predecessorId,
        successorTaskId: successorId,
      },
    });
    return dependency ? this.mapToDTO(dependency) : null;
  }

  /**
   * 递归查找所有前置任务（完整依赖链）
   */
  async findAllPredecessorIds(taskId: string): Promise<string[]> {
    const visited = new Set<string>();
    const result: string[] = [];
    await this.traversePredecessors(taskId, visited, result);
    return result;
  }

  private async traversePredecessors(
    taskId: string,
    visited: Set<string>,
    result: string[],
  ): Promise<void> {
    if (visited.has(taskId)) return;
    visited.add(taskId);

    const deps = await this.findBySuccessorId(taskId);
    for (const dep of deps) {
      if (!result.includes(dep.predecessorTaskId)) {
        result.push(dep.predecessorTaskId);
      }
      await this.traversePredecessors(dep.predecessorTaskId, visited, result);
    }
  }

  /**
   * 递归查找所有后续任务（完整依赖链）
   */
  async findAllSuccessorIds(taskId: string): Promise<string[]> {
    const visited = new Set<string>();
    const result: string[] = [];
    await this.traverseSuccessors(taskId, visited, result);
    return result;
  }

  private async traverseSuccessors(
    taskId: string,
    visited: Set<string>,
    result: string[],
  ): Promise<void> {
    if (visited.has(taskId)) return;
    visited.add(taskId);

    const deps = await this.findByPredecessorId(taskId);
    for (const dep of deps) {
      if (!result.includes(dep.successorTaskId)) {
        result.push(dep.successorTaskId);
      }
      await this.traverseSuccessors(dep.successorTaskId, visited, result);
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.taskDependency.delete({ where: { id } });
  }

  async deleteByTaskId(taskId: string): Promise<void> {
    await this.prisma.taskDependency.deleteMany({
      where: {
        OR: [
          { predecessorTaskId: taskId },
          { successorTaskId: taskId },
        ],
      },
    });
  }

  async update(
    id: string,
    data: { dependencyType?: DependencyType; lagDays?: number },
  ): Promise<TaskDependencyServerDTO> {
    const dependency = await this.prisma.taskDependency.update({
      where: { id },
      data: {
        ...(data.dependencyType !== undefined
          ? { dependencyType: String(data.dependencyType) }
          : {}),
        ...(data.lagDays !== undefined ? { lagDays: data.lagDays } : {}),
      },
    });
    return this.mapToDTO(dependency);
  }

  async findAllByIdentityId(identityId: string): Promise<TaskDependencyServerDTO[]> {
    const templates = await this.prisma.taskTemplate.findMany({
      where: { identityId },
      select: { id: true },
    });

    const templateIds = templates.map((t: any) => t.id);
    if (templateIds.length === 0) return [];

    const dependencies = await this.prisma.taskDependency.findMany({
      where: {
        OR: [
          { predecessorTaskId: { in: templateIds } },
          { successorTaskId: { in: templateIds } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    return dependencies.map((dep: any) => this.mapToDTO(dep));
  }
}