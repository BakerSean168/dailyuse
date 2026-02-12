/**
 * Task Dependency Validation Service
 *
 * 负责验证任务依赖关系的合法性，包括：
 * - 循环依赖检测（Circular Dependency Detection）
 * - 依赖规则验证（Rule Validation）
 * - 重复依赖检测（Duplicate Detection）
 * - 自依赖检测（Self-dependency Check）
 */

import type { TaskTemplateClientDTO, TaskInstanceClientDTO, TaskDependencyServerDTO, TaskDependencyClientDTO, ValidateDependencyRequest, ValidateDependencyResponse } from '@dailyuse/contracts/task';
import type { TaskForDAG } from '../types/task-dag.types';
import { taskDependencyApiClient } from '../../infrastructure-client/task.container';

/**
 * 验证结果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * 验证错误
 */
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  code: string;
  message: string;
  details?: any;
}

/**
 * 循环依赖检测结果
 */
export interface CircularDependencyResult {
  hasCycle: boolean;
  cyclePath: string[]; // Task UUIDs forming the cycle
  cyclePathNames?: string[]; // Task titles for display
}

/**
 * 依赖图节点
 */
interface GraphNode {
  uuid: string;
  successors: string[]; // 后继任务
}

export class TaskDependencyValidationService {
  /**
   * 验证依赖关系（综合验证）
   */
  async validateDependency(
    predecessorUuid: string,
    successorUuid: string,
    dependencyType: string,
    existingDependencies: TaskDependencyClientDTO[],
    allTasks?: TaskForDAG[],
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. 基本规则验证
    const ruleErrors = this.validateDependencyRules(predecessorUuid, successorUuid, dependencyType);
    errors.push(...ruleErrors);

    // 2. 自依赖检测
    if (this.isSelfDependency(predecessorUuid, successorUuid)) {
      errors.push({
        code: 'SELF_DEPENDENCY',
        message: '任务不能依赖自身',
        field: 'predecessorUuid',
      });
    }

    // 3. 重复依赖检测
    if (
      this.isDuplicateDependency(
        predecessorUuid,
        successorUuid,
        dependencyType,
        existingDependencies,
      )
    ) {
      errors.push({
        code: 'DUPLICATE_DEPENDENCY',
        message: '该依赖关系已存在',
        details: { predecessorUuid, successorUuid, dependencyType },
      });
    }

    // 4. 循环依赖检测
    const circularResult = this.detectCircularDependency(
      predecessorUuid,
      successorUuid,
      existingDependencies,
      allTasks,
    );

    if (circularResult.hasCycle) {
      errors.push({
        code: 'CIRCULAR_DEPENDENCY',
        message: '创建此依赖会形成循环依赖',
        details: {
          cyclePath: circularResult.cyclePath,
          cyclePathNames: circularResult.cyclePathNames,
        },
      });
    }

    // 5. 警告：复杂依赖链
    const chainDepth = this.calculateChainDepth(successorUuid, existingDependencies);
    if (chainDepth > 5) {
      warnings.push({
        code: 'DEEP_DEPENDENCY_CHAIN',
        message: `依赖链过长（${chainDepth} 层），可能影响性能`,
        details: { depth: chainDepth },
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 检测循环依赖（使用 DFS）
   * 时间复杂度: O(V + E)，V = 任务数，E = 依赖数
   */
  detectCircularDependency(
    predecessorUuid: string,
    successorUuid: string,
    existingDependencies: TaskDependencyClientDTO[],
    allTasks?: TaskForDAG[],
  ): CircularDependencyResult {
    // 构建邻接表（前驱 → 后继）
    const graph = this.buildDependencyGraph(existingDependencies);

    // 添加新的依赖边
    if (!graph.has(predecessorUuid)) {
      graph.set(predecessorUuid, new Set());
    }
    graph.get(predecessorUuid)!.add(successorUuid);

    // DFS 检测从 successorUuid 是否能回到 predecessorUuid
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const hasCycle = this.dfsDetectCycle(
      successorUuid,
      predecessorUuid,
      graph,
      visited,
      recursionStack,
      path,
    );

    if (hasCycle) {
      // 提取循环路径
      const cycleStartIndex = path.indexOf(predecessorUuid);
      const cyclePath =
        cycleStartIndex >= 0
          ? [...path.slice(cycleStartIndex), predecessorUuid]
          : [successorUuid, predecessorUuid];

      // 获取任务名称
      const cyclePathNames = allTasks
        ? cyclePath.map((uuid) => {
            const task = allTasks.find((t) => t.uuid === uuid);
            return task?.title || uuid.slice(0, 8);
          })
        : undefined;

      return {
        hasCycle: true,
        cyclePath,
        cyclePathNames,
      };
    }

    return {
      hasCycle: false,
      cyclePath: [],
    };
  }

  /**
   * DFS 循环检测
   */
  private dfsDetectCycle(
    current: string,
    target: string,
    graph: Map<string, Set<string>>,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[],
  ): boolean {
    // 如果当前节点就是目标，找到循环
    if (current === target && recursionStack.size > 0) {
      return true;
    }

    // 已访问过且不在递归栈中，无需再访问
    if (visited.has(current)) {
      return false;
    }

    // 标记当前节点
    visited.add(current);
    recursionStack.add(current);
    path.push(current);

    // 访问所有后继节点
    const successors = graph.get(current) || new Set();
    for (const successor of successors) {
      if (this.dfsDetectCycle(successor, target, graph, visited, recursionStack, path)) {
        return true;
      }
    }

    // 回溯
    recursionStack.delete(current);
    path.pop();

    return false;
  }

  /**
   * 构建依赖图（邻接表）
   */
  private buildDependencyGraph(
    dependencies: TaskDependencyClientDTO[],
  ): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();

    dependencies.forEach((dep) => {
      if (!graph.has(dep.predecessorTaskUuid)) {
        graph.set(dep.predecessorTaskUuid, new Set());
      }
      graph.get(dep.predecessorTaskUuid)!.add(dep.successorTaskUuid);
    });

    return graph;
  }

  /**
   * 验证依赖规则
   */
  private validateDependencyRules(
    predecessorUuid: string,
    successorUuid: string,
    dependencyType: string,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // 检查 UUID 格式
    if (!predecessorUuid || predecessorUuid.length < 10) {
      errors.push({
        code: 'INVALID_PREDECESSOR_UUID',
        message: '前置任务 UUID 无效',
        field: 'predecessorUuid',
      });
    }

    if (!successorUuid || successorUuid.length < 10) {
      errors.push({
        code: 'INVALID_SUCCESSOR_UUID',
        message: '后继任务 UUID 无效',
        field: 'successorUuid',
      });
    }

    // 检查依赖类型
    const validTypes = ['FS', 'SS', 'FF', 'SF'];
    if (!validTypes.includes(dependencyType)) {
      errors.push({
        code: 'INVALID_DEPENDENCY_TYPE',
        message: `依赖类型必须是: ${validTypes.join(', ')}`,
        field: 'dependencyType',
        details: { provided: dependencyType, valid: validTypes },
      });
    }

    return errors;
  }

  /**
   * 检查是否为自依赖
   */
  private isSelfDependency(predecessorUuid: string, successorUuid: string): boolean {
    return predecessorUuid === successorUuid;
  }

  /**
   * 检查是否为重复依赖
   */
  private isDuplicateDependency(
    predecessorUuid: string,
    successorUuid: string,
    dependencyType: string,
    existingDependencies: TaskDependencyClientDTO[],
  ): boolean {
    return existingDependencies.some(
      (dep) =>
        dep.predecessorTaskUuid === predecessorUuid &&
        dep.successorTaskUuid === successorUuid &&
        dep.dependencyType === dependencyType,
    );
  }

  /**
   * 计算依赖链深度
   */
  private calculateChainDepth(
    taskUuid: string,
    dependencies: TaskDependencyClientDTO[],
  ): number {
    const graph = this.buildDependencyGraph(dependencies);
    const visited = new Set<string>();

    const dfs = (uuid: string): number => {
      if (visited.has(uuid)) return 0;
      visited.add(uuid);

      const successors = graph.get(uuid) || new Set();
      if (successors.size === 0) return 1;

      let maxDepth = 0;
      for (const successor of successors) {
        maxDepth = Math.max(maxDepth, dfs(successor));
      }

      return maxDepth + 1;
    };

    return dfs(taskUuid);
  }

  /**
   * 调用后端验证 API
   */
  async validateDependencyRemote(
    request: ValidateDependencyRequest,
  ): Promise<ValidateDependencyResponse> {
    try {
      return await taskDependencyApiClient.validateDependency(request);
    } catch (error) {
      console.error('Remote validation failed:', error);
      throw error;
    }
  }

  /**
   * 获取受影响的任务列表
   * 当创建/删除依赖时，哪些任务的状态可能需要更新
   */
  calculateAffectedTasks(
    taskUuid: string,
    dependencies: TaskDependencyClientDTO[],
    isCreation: boolean,
  ): string[] {
    const graph = this.buildDependencyGraph(dependencies);
    const affected = new Set<string>();

    if (isCreation) {
      // 创建依赖：影响后继任务及其后续链
      const visited = new Set<string>();
      const collectSuccessors = (uuid: string) => {
        if (visited.has(uuid)) return;
        visited.add(uuid);
        affected.add(uuid);

        const successors = graph.get(uuid) || new Set();
        successors.forEach((successor) => collectSuccessors(successor));
      };

      collectSuccessors(taskUuid);
    } else {
      // 删除依赖：影响前驱任务及其前置链
      const reversedGraph = new Map<string, Set<string>>();
      dependencies.forEach((dep) => {
        if (!reversedGraph.has(dep.successorTaskUuid)) {
          reversedGraph.set(dep.successorTaskUuid, new Set());
        }
        reversedGraph.get(dep.successorTaskUuid)!.add(dep.predecessorTaskUuid);
      });

      const visited = new Set<string>();
      const collectPredecessors = (uuid: string) => {
        if (visited.has(uuid)) return;
        visited.add(uuid);
        affected.add(uuid);

        const predecessors = reversedGraph.get(uuid) || new Set();
        predecessors.forEach((pred) => collectPredecessors(pred));
      };

      collectPredecessors(taskUuid);
    }

    return Array.from(affected);
  }
}

// 导出单例
export const taskDependencyValidationService = new TaskDependencyValidationService();

