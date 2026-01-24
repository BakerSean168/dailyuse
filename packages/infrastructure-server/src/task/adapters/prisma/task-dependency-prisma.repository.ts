/**
 * TaskDependency Prisma Repository
 * 浠诲姟渚濊禆鍏崇郴 Prisma Repository瀹炵幇
 * 鏍囧噯 Express/TypeScript 妯″紡 - 绉婚櫎浜?NestJS @Injectable 瑁呴グ鍣?
 */

import type {  PrismaClient  } from "@prisma/client";
import type { ITaskDependencyRepository } from '@dailyuse/domain-server/task';
import type {
  TaskDependencyServerDTO,
  CreateTaskDependencyRequest,
  UpdateTaskDependencyRequest,
} from '@dailyuse/contracts/task';

/**
 * Prisma 瀹炵幇鐨勪换鍔′緷璧栦粨鍌?
 */
export class TaskDependencyPrismaRepository implements ITaskDependencyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * 灏?Prisma 妯″瀷杞崲涓?DTO
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
   * Create渚濊禆鍏崇郴
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
   * 鏍规嵁 UUID 鏌ユ壘
   */
  async findByUuid(uuid: string): Promise<TaskDependencyServerDTO | null> {
    const dependency = await this.prisma.taskDependency.findUnique({
      where: { uuid },
    });

    return dependency ? this.mapToDTO(dependency) : null;
  }

  /**
   * 鏌ユ壘鎸囧畾浠诲姟鐨勬墍鏈夊墠缃緷璧栵紙姝や换鍔℃槸鍚庣画浠诲姟锛?
   */
  async findBySuccessor(taskUuid: string): Promise<TaskDependencyServerDTO[]> {
    const dependencies = await this.prisma.taskDependency.findMany({
      where: { successorTaskUuid: taskUuid },
      orderBy: { createdAt: 'asc' },
    });

    return dependencies.map((dep) => this.mapToDTO(dep));
  }

  /**
   * 鏌ユ壘渚濊禆鎸囧畾浠诲姟鐨勬墍鏈変换鍔★紙姝や换鍔℃槸鍓嶇疆浠诲姟锛?
   */
  async findByPredecessor(taskUuid: string): Promise<TaskDependencyServerDTO[]> {
    const dependencies = await this.prisma.taskDependency.findMany({
      where: { predecessorTaskUuid: taskUuid },
      orderBy: { createdAt: 'asc' },
    });

    return dependencies.map((dep) => this.mapToDTO(dep));
  }

  /**
   * 鏌ユ壘鐗瑰畾鐨勫墠缃?鍚庣画渚濊禆鍏崇郴
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
   * 閫掑綊鏌ユ壘All鏈夊墠缃换鍔★紙瀹屾暣渚濊禆閾撅級
   */
  async findAllPredecessors(taskUuid: string): Promise<string[]> {
    const visited = new Set<string>();
    const result: string[] = [];

    await this.traversePredecessors(taskUuid, visited, result);

    return result;
  }

  /**
   * 閫掑綊閬嶅巻鍓嶇疆浠诲姟
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
   * 閫掑綊鏌ユ壘All鏈夊悗缁换鍔★紙瀹屾暣渚濊禆閾撅級
   */
  async findAllSuccessors(taskUuid: string): Promise<string[]> {
    const visited = new Set<string>();
    const result: string[] = [];

    await this.traverseSuccessors(taskUuid, visited, result);

    return result;
  }

  /**
   * 閫掑綊閬嶅巻鍚庣画浠诲姟
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
   * Delete渚濊禆鍏崇郴
   */
  async delete(uuid: string): Promise<void> {
    await this.prisma.taskDependency.delete({
      where: { uuid },
    });
  }

  /**
   * Delete涓庢寚瀹氫换鍔＄浉鍏崇殑All鏈変緷璧栧叧绯?
   */
  async deleteByTask(taskUuid: string): Promise<void> {
    await this.prisma.taskDependency.deleteMany({
      where: {
        OR: [{ predecessorTaskUuid: taskUuid }, { successorTaskUuid: taskUuid }],
      },
    });
  }

  /**
   * Update渚濊禆鍏崇郴
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
   * Get璐︽埛鐨勬墍鏈変緷璧栧叧绯?
   * 閫氳繃鍏宠仈鐨勪换鍔℃ā鏉胯幏鍙栬处鎴蜂俊鎭?
   */
  async findAllByAccount(accountUuid: string): Promise<TaskDependencyServerDTO[]> {
    // 鍏堣幏鍙栬处鎴风殑All鏈変换鍔℃ā鏉?UUID
    const templates = await this.prisma.taskTemplate.findMany({
      where: { accountUuid },
      select: { uuid: true },
    });

    const templateUuids = templates.map((t) => t.uuid);

    if (templateUuids.length === 0) {
      return [];
    }

    // 鏌ユ壘All鏈夌浉鍏崇殑渚濊禆鍏崇郴
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
