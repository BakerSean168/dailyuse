/**
 * TaskDependency Prisma Repository
 * 任务依赖关系 Prisma 仓储实现
 * 标准 Express/TypeScript 模式 - 移除了 NestJS @Injectable 装饰器
 */

import { PrismaClient } from '@prisma/client';
import type { ITaskDependencyRepository } from '@dailyuse/domain-server/task';
import type {
  TaskDependencyServerDTO,
  CreateTaskDependencyRequest,
  UpdateTaskDependencyRequest,
} from '@dailyuse/contracts/task';

/**
 * Prisma 实现的任务依赖仓储
 */
export class PrismaTaskDependencyRepository implements ITaskDependencyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * 将 Prisma 模型转换为 DTO
   */
  private mapToDTO(data: any): TaskDependencyServerDTO {
    return {
      uuid: data.uuid,
      predecessorTaskUuid: data.predecessorTaskUuid,
      successorTaskUuid: data.successorTaskUuid,
      dependencyType: data.dependencyType,
      lagDays: data.lagDays,
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
    };
  }

  /**
   * 创建依赖关系
   */
  async create(data: CreateTaskDependencyRequest): Promise<TaskDependencyServerDTO> {
    const dependency = await this.prisma.taskDependency.create({
      data: {
        uuid: crypto.randomUUID(),
        predecessorTaskUuid: data.predecessorTaskUuid,
        successorTaskUuid: data.successorTaskUuid,
        dependencyType: String(data.dependencyType || 'FINISH_TO_START'),
        lagDays: data.lagDays ?? 0,
        updatedAt: new Date(),
      },
    });

    return this.mapToDTO(dependency);
  }

  /**
   * 根据 UUID 查找
   */
  async findByUuid(uuid: string): Promise<TaskDependencyServerDTO | null> {
    const dependency = await this.prisma.taskDependency.findUnique({
      where: { uuid },
    });

    return dependency ? this.mapToDTO(dependency) : null;
  }

  /**
   * 查找指定任务的所有前置依赖（此任务是后续任务）
   */
  async findBySuccessor(taskUuid: string): Promise<TaskDependencyServerDTO[]> {
    const dependencies = await this.prisma.taskDependency.findMany({
      where: { successorTaskUuid: taskUuid },
      orderBy: { createdAt: 'asc' },
    });

    return dependencies.map((dep) => this.mapToDTO(dep));
  }

  /**
   * 查找依赖指定任务的所有任务（此任务是前置任务）
   */
  async findByPredecessor(taskUuid: string): Promise<TaskDependencyServerDTO[]> {
    const dependencies = await this.prisma.taskDependency.findMany({
      where: { predecessorTaskUuid: taskUuid },
      orderBy: { createdAt: 'asc' },
    });

    return dependencies.map((dep) => this.mapToDTO(dep));
  }

  /**
   * 查找特定的前置-后续依赖关系
   */
  async findByPredecessorAndSuccessor(
    predecessorTaskUuid: string,
    successorTaskUuid: string,
  ): Promise<TaskDependencyServerDTO | null> {
    const dependency = await this.prisma.taskDependency.findFirst({
      where: {
        predecessorTaskUuid,
        successorTaskUuid,
      },
    });

    return dependency ? this.mapToDTO(dependency) : null;
  }

  /**
   * 递归查找所有前置任务（完整依赖链）
   */
  async findAllPredecessors(taskUuid: string): Promise<string[]> {
    const visited = new Set<string>();
    const result: string[] = [];

    await this.traversePredecessors(taskUuid, visited, result);

    return result;
  }

  /**
   * 递归遍历前置任务
   * @private
   */
  private async traversePredecessors(
    taskUuid: string,
    visited: Set<string>,
    result: string[],
  ): Promise<void> {
    if (visited.has(taskUuid)) {
      return;
    }

    visited.add(taskUuid);

    const dependencies = await this.findBySuccessor(taskUuid);

    for (const dep of dependencies) {
      const predecessorUuid = dep.predecessorTaskUuid;
      if (!result.includes(predecessorUuid)) {
        result.push(predecessorUuid);
      }
      await this.traversePredecessors(predecessorUuid, visited, result);
    }
  }

  /**
   * 递归查找所有后续任务（完整依赖链）
   */
  async findAllSuccessors(taskUuid: string): Promise<string[]> {
    const visited = new Set<string>();
    const result: string[] = [];

    await this.traverseSuccessors(taskUuid, visited, result);

    return result;
  }

  /**
   * 递归遍历后续任务
   * @private
   */
  private async traverseSuccessors(
    taskUuid: string,
    visited: Set<string>,
    result: string[],
  ): Promise<void> {
    if (visited.has(taskUuid)) {
      return;
    }

    visited.add(taskUuid);

    const dependencies = await this.findByPredecessor(taskUuid);

    for (const dep of dependencies) {
      const successorUuid = dep.successorTaskUuid;
      if (!result.includes(successorUuid)) {
        result.push(successorUuid);
      }
      await this.traverseSuccessors(successorUuid, visited, result);
    }
  }

  /**
   * 删除依赖关系
   */
  async delete(uuid: string): Promise<void> {
    await this.prisma.taskDependency.delete({
      where: { uuid },
    });
  }

  /**
   * 删除与指定任务相关的所有依赖关系
   */
  async deleteByTask(taskUuid: string): Promise<void> {
    await this.prisma.taskDependency.deleteMany({
      where: {
        OR: [{ predecessorTaskUuid: taskUuid }, { successorTaskUuid: taskUuid }],
      },
    });
  }

  /**
   * 更新依赖关系
   */
  async update(uuid: string, data: UpdateTaskDependencyRequest): Promise<TaskDependencyServerDTO> {
    const dependency = await this.prisma.taskDependency.update({
      where: { uuid },
      data: {
        dependencyType: data.dependencyType,
        lagDays: data.lagDays,
      },
    });

    return this.mapToDTO(dependency);
  }

  /**
   * 获取账户的所有依赖关系
   * 通过关联的任务模板获取账户信息
   */
  async findAllByAccount(accountUuid: string): Promise<TaskDependencyServerDTO[]> {
    // 先获取账户的所有任务模板 UUID
    const templates = await this.prisma.taskTemplate.findMany({
      where: { accountUuid },
      select: { uuid: true },
    });

    const templateUuids = templates.map((t) => t.uuid);

    if (templateUuids.length === 0) {
      return [];
    }

    // 查找所有相关的依赖关系
    const dependencies = await this.prisma.taskDependency.findMany({
      where: {
        OR: [
          { predecessorTaskUuid: { in: templateUuids } },
          { successorTaskUuid: { in: templateUuids } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    return dependencies.map((dep) => this.mapToDTO(dep));
  }
}
