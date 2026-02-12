/**
 * TaskDependency Domain Service
 * 任务依赖关系领域服务
 *
 * 职责�?
 * - 循环依赖检�?
 * - 依赖状态计�?
 * - 依赖关系管理
 */

import type {
  CircularDependencyValidationResult,
  TaskDependencyServerDTO,
} from '@dailyuse/contracts/task';
import { DependencyStatus, DependencyType } from '@dailyuse/contracts/task';
import { TaskTemplate } from '../aggregates/task-template';
import { TaskDependency } from '../aggregates/task-dependency';

// Type aliases for easier usage

export class TaskDependencyService {
  constructor() {}

  /**
   * 检测是否会形成循环依赖
   * 使用深度优先搜索（DFS）算�?
   *
   * @param predecessorUuid 前置任务 UUID
   * @param successorUuid 后续任务 UUID
   * @param allDependencies 所有相关的依赖关系列表（由应用层传入）
   * @returns 验证结果，包含是否有效和循环路径
   */
  detectCircularDependency(
    predecessorUuid: string,
    successorUuid: string,
    allDependencies: TaskDependencyServerDTO[],
  ): CircularDependencyValidationResult {
    // 如果添加这个依赖，检查是否存在从 successor �?predecessor 的路�?
    // 如果存在，说明会形成循环
    const visited = new Set<string>();
    const path: string[] = [];

    const hasCycle = this.dfsDetectCycle(
      successorUuid,
      predecessorUuid,
      visited,
      path,
      allDependencies,
    );

    if (hasCycle) {
      return {
        isValid: false,
        cycle: [...path, predecessorUuid],
        message: `创建此依赖会形成循环依赖: ${[...path, predecessorUuid].join(' �?')}`,
      };
    }

    return { isValid: true };
  }

  /**
   * 深度优先搜索检测循�?
   * @private
   */
  private dfsDetectCycle(
    current: string,
    target: string,
    visited: Set<string>,
    path: string[],
    allDependencies: TaskDependencyServerDTO[],
  ): boolean {
    // 找到目标，说明存在循�?
    if (current === target) {
      return true;
    }

    // 已访问过，避免重�?
    if (visited.has(current)) {
      return false;
    }

    visited.add(current);
    path.push(current);

    // 获取当前任务的所有后续任务（从传入的依赖列表中查找）
    const dependencies = allDependencies.filter((d) => d.predecessorTaskId === current);

    for (const dep of dependencies) {
      if (this.dfsDetectCycle(dep.successorTaskId, target, visited, path, allDependencies)) {
        return true;
      }
    }

    path.pop();
    return false;
  }

  /**
   * 计算任务的依赖状�?
   *
   * @param taskUuid 任务 UUID
   * @param dependencies 此任务的前置依赖关系
   * @param predecessorTasks 前置任务列表
   * @returns 依赖状�?
   */
  calculateDependencyStatus(
    taskUuid: string,
    dependencies: TaskDependencyServerDTO[],
    predecessorTasks: (TaskTemplate | null)[],
  ): {
    status: DependencyStatus;
    isBlocked: boolean;
    blockingReason?: string;
  } {
    if (dependencies.length === 0) {
      return {
        status: 'NONE' as DependencyStatus,
        isBlocked: false,
      };
    }

    // Check if some predecessor tasks are not found
    const notFound = predecessorTasks.some((task) => task === null);
    if (notFound) {
      return {
        status: 'BLOCKED' as DependencyStatus,
        isBlocked: true,
        blockingReason: undefined,
      };
    }

    // Filter out null values
    const tasks = predecessorTasks.filter(Boolean) as TaskTemplate[];

    // Check if any predecessor task is blocked
    // TODO: Task completion status should check TaskInstance instead of TaskTemplate
    // TaskTemplate only has management state (ACTIVE/PAUSED/ARCHIVED/DELETED)
    // TaskInstance has execution state (PENDING/IN_PROGRESS/COMPLETED etc)
    const anyBlocked = tasks.some((task: any) => task.isBlocked === true);
    if (anyBlocked) {
      const blockedTasks = tasks
        .filter((task: any) => task.isBlocked)
        .map((task: any) => task.title)
        .join(', ');
      return {
        status: 'BLOCKED' as DependencyStatus,
        isBlocked: true,
        blockingReason: `前置任务被阻�? ${blockedTasks}`,
      };
    }

    // TODO: 以下逻辑需要重�?
    // 应该检�?TaskInstance 的状态，而不�?TaskTemplate
    // 当前暂时返回 WAITING 状�?
    /*
    // 检查是否所有前置任务都已完�?
    const allCompleted = tasks.every((task) => task.status === 'COMPLETED');
    if (allCompleted) {
      return {
        status: 'READY' as DependencyStatus,
        isBlocked: false,
      };
    }

    // 否则处于等待状�?
    const waitingFor = tasks
      .filter((task) => task.status !== 'COMPLETED')
      .map((task) => task.title)
      .join(', ');
    */

    return {
      status: 'WAITING' as DependencyStatus,
      isBlocked: true,
      blockingReason: `等待前置任务完成 (需要检�?TaskInstance 状�?`,
    };
  }

  /**
   * 创建依赖关系实体（纯内存操作�?
   *
   * @param predecessor 前置任务
   * @param successor 后续任务
   * @param accountUuid 账户 UUID
   * @returns 创建的依赖关系实�?
   */
  createDependency(
    predecessor: TaskTemplate,
    successor: TaskTemplate,
    accountUuid: string,
  ): TaskDependency {
    // 1. 检查是否是同一个任�?
    if (predecessor.id === successor.id) {
      throw new Error('任务不能依赖自己');
    }

    // 2. 创建依赖关系实体
    return TaskDependency.create({
      predecessorTaskId: predecessor.id,
      successorTaskId: successor.id,
      dependencyType: 'FINISH_TO_START' as DependencyType, // 默认类型
    });
  }

  /**
   * 计算任务深度
   */
  calculateDepth(taskUuid: string, allDependencies: TaskDependencyServerDTO[]): number {
    const dependencies = allDependencies.filter((d) => d.successorTaskId === taskUuid);

    if (dependencies.length === 0) {
      return 0; // 根任�?
    }

    const depths = dependencies.map((dep) =>
      this.calculateDepth(dep.predecessorTaskId, allDependencies),
    );

    return Math.max(...depths) + 1;
  }
}
