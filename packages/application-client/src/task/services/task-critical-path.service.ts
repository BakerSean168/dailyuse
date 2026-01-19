/**
 * Task Critical Path Service
 *
 * 实现关键路径法 (Critical Path Method, CPM) 用于项目进度管理：
 * - 拓扑排序 (Topological Sort)
 * - 正向计算最早开始时间 (ES - Earliest Start)
 * - 反向计算最晚开始时间 (LS - Latest Start)
 * - 识别零松弛时间的关键任务
 * - 生成项目优化建议
 *
 * 时间复杂度: O(V + E)，V = 任务数，E = 依赖数
 */

import { TaskTemplateStatus, TaskType } from '@dailyuse/contracts/task';
import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  TaskDependencyServerDTO,
  TaskDependencyClientDTO,
} from '@dailyuse/contracts/task';
import type { TaskForDAG } from '../types/task-dag.types';

/**
 * 任务时序信息
 */
export interface TaskTiming {
  uuid: string;
  title: string;
  earliestStart: number; // ES - 最早开始时间 (分钟)
  latestStart: number; // LS - 最晚开始时间 (分钟)
  earliestFinish: number; // EF = ES + duration
  latestFinish: number; // LF = LS + duration
  slack: number; // 松弛时间 = LS - ES
  isCritical: boolean; // 是否关键任务 (slack === 0)
  duration: number; // 任务工期 (分钟)
}

/**
 * 关键路径分析结果
 */
export interface CriticalPathResult {
  criticalTasks: TaskForDAG[]; // 关键路径上的任务
  criticalPath: string[]; // 关键路径 (任务 UUID 序列)
  projectDuration: number; // 项目总工期 (分钟)
  taskTimings: Map<string, TaskTiming>; // 所有任务的时序信息
  suggestions: OptimizationSuggestion[]; // 优化建议
}

/**
 * 优化建议类型
 */
export enum SuggestionType {
  REDUCE_DURATION = 'reduce_duration', // 缩短关键任务工期
  PARALLELIZE = 'parallelize', // 并行化任务
  REMOVE_DEPENDENCY = 'remove_dependency', // 移除非必要依赖
}

/**
 * 项目优化建议
 */
export interface OptimizationSuggestion {
  type: SuggestionType;
  taskUuid: string;
  taskTitle: string;
  impact: number; // 预估节省时间 (分钟)
  description: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * 项目时间线信息
 */
export interface ProjectTimeline {
  totalDuration: number; // 总工期 (分钟)
  criticalTaskCount: number; // 关键任务数
  totalSlack: number; // 总松弛时间
  averageSlack: number; // 平均松弛时间
  completionDate?: Date; // 预估完成日期
}

export class TaskCriticalPathService {
  /**
   * 计算关键路径
   *
   * 算法步骤：
   * 1. 拓扑排序 (验证无环图)
   * 2. 正向计算 ES 和 EF
   * 3. 反向计算 LS 和 LF
   * 4. 计算松弛时间
   * 5. 识别关键任务 (slack = 0)
   */
  calculateCriticalPath(
    tasks: TaskForDAG[],
    dependencies: TaskDependencyClientDTO[],
  ): CriticalPathResult {
    // 1. 拓扑排序
    const sortedTasks = this.topologicalSort(tasks, dependencies);

    if (sortedTasks.length !== tasks.length) {
      throw new Error('Cyclic dependency detected! Cannot calculate critical path.');
    }

    // 2. 计算所有任务的时序信息
    const taskTimings = this.calculateTaskTimings(sortedTasks, dependencies);

    // 3. 识别关键任务
    const criticalTasks: TaskForDAG[] = [];
    const criticalPath: string[] = [];

    sortedTasks.forEach((task) => {
      const timing = taskTimings.get(task.uuid)!;
      if (timing.isCritical) {
        criticalTasks.push(task);
        criticalPath.push(task.uuid);
      }
    });

    // 4. 计算项目总工期
    const projectDuration = Math.max(
      ...Array.from(taskTimings.values()).map((t) => t.earliestFinish),
      0,
    );

    // 5. 生成优化建议
    const suggestions = this.getOptimizationSuggestions(
      criticalTasks,
      taskTimings,
      tasks,
      dependencies,
    );

    return {
      criticalTasks,
      criticalPath,
      projectDuration,
      taskTimings,
      suggestions,
    };
  }

  /**
   * 拓扑排序 (Kahn's Algorithm)
   *
   * 时间复杂度: O(V + E)
   * 空间复杂度: O(V + E)
   */
  topologicalSort(tasks: TaskForDAG[], dependencies: TaskDependencyClientDTO[]): TaskForDAG[] {
    // 构建入度表和邻接表
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();
    const taskMap = new Map<string, TaskForDAG>();

    tasks.forEach((task) => {
      inDegree.set(task.uuid, 0);
      adjList.set(task.uuid, []);
      taskMap.set(task.uuid, task);
    });

    dependencies.forEach((dep) => {
      const current = inDegree.get(dep.successorTaskUuid) || 0;
      inDegree.set(dep.successorTaskUuid, current + 1);

      const neighbors = adjList.get(dep.predecessorTaskUuid) || [];
      neighbors.push(dep.successorTaskUuid);
      adjList.set(dep.predecessorTaskUuid, neighbors);
    });

    // 初始化队列：所有入度为 0 的节点
    const queue: string[] = [];
    inDegree.forEach((degree, uuid) => {
      if (degree === 0) {
        queue.push(uuid);
      }
    });

    // BFS 遍历
    const sorted: TaskForDAG[] = [];

    while (queue.length > 0) {
      const currentUuid = queue.shift()!;
      const currentTask = taskMap.get(currentUuid);

      if (currentTask) {
        sorted.push(currentTask);
      }

      // 遍历所有后继节点
      const neighbors = adjList.get(currentUuid) || [];
      neighbors.forEach((neighborUuid) => {
        const newDegree = (inDegree.get(neighborUuid) || 1) - 1;
        inDegree.set(neighborUuid, newDegree);

        if (newDegree === 0) {
          queue.push(neighborUuid);
        }
      });
    }

    return sorted;
  }

  /**
   * 计算所有任务的时序信息
   *
   * 包括：ES, LS, EF, LF, Slack
   */
  calculateTaskTimings(
    sortedTasks: TaskForDAG[],
    dependencies: TaskDependencyClientDTO[],
  ): Map<string, TaskTiming> {
    const taskTimings = new Map<string, TaskTiming>();

    // Step 1: 正向计算 ES 和 EF
    sortedTasks.forEach((task) => {
      const predecessorDeps = dependencies.filter((dep) => dep.successorTaskUuid === task.uuid);

      let earliestStart = 0;

      if (predecessorDeps.length > 0) {
        earliestStart = Math.max(
          ...predecessorDeps.map((dep) => {
            const predTiming = taskTimings.get(dep.predecessorTaskUuid);
            return predTiming ? predTiming.earliestFinish : 0;
          }),
        );
      }

      const duration = task.estimatedMinutes || 0;
      const earliestFinish = earliestStart + duration;

      taskTimings.set(task.uuid, {
        uuid: task.uuid,
        title: task.title,
        earliestStart,
        latestStart: 0, // 待计算
        earliestFinish,
        latestFinish: 0, // 待计算
        slack: 0, // 待计算
        isCritical: false, // 待计算
        duration,
      });
    });

    // Step 2: 计算项目总工期
    const projectDuration = Math.max(
      ...Array.from(taskTimings.values()).map((t) => t.earliestFinish),
      0,
    );

    // Step 3: 反向计算 LS 和 LF
    for (let i = sortedTasks.length - 1; i >= 0; i--) {
      const task = sortedTasks[i];
      const timing = taskTimings.get(task.uuid)!;

      const successorDeps = dependencies.filter((dep) => dep.predecessorTaskUuid === task.uuid);

      let latestFinish: number;

      if (successorDeps.length === 0) {
        // 终点任务：LF = 项目完成时间
        latestFinish = projectDuration;
      } else {
        // 有后继任务：LF = min(后继任务的 LS)
        latestFinish = Math.min(
          ...successorDeps.map((dep) => {
            const succTiming = taskTimings.get(dep.successorTaskUuid);
            return succTiming ? succTiming.latestStart : projectDuration;
          }),
        );
      }

      const latestStart = latestFinish - timing.duration;
      const slack = latestStart - timing.earliestStart;
      const isCritical = Math.abs(slack) < 0.001; // 浮点数容忍度

      timing.latestStart = latestStart;
      timing.latestFinish = latestFinish;
      timing.slack = slack;
      timing.isCritical = isCritical;
    }

    return taskTimings;
  }

  /**
   * 生成项目优化建议
   */
  getOptimizationSuggestions(
    criticalTasks: TaskForDAG[],
    taskTimings: Map<string, TaskTiming>,
    allTasks: TaskForDAG[],
    dependencies: TaskDependencyClientDTO[],
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // 建议 1: 缩短关键任务的工期
    criticalTasks.forEach((task) => {
      const timing = taskTimings.get(task.uuid)!;

      if (timing.duration > 60) {
        // 超过 1 小时的任务
        const potentialSavings = timing.duration * 0.2; // 假设可缩短 20%

        suggestions.push({
          type: SuggestionType.REDUCE_DURATION,
          taskUuid: task.uuid,
          taskTitle: task.title,
          impact: potentialSavings,
          description: `缩短"${task.title}"的工期 20%，可节省 ${Math.round(potentialSavings)} 分钟`,
          priority: potentialSavings > 120 ? 'high' : 'medium',
        });
      }
    });

    // 建议 2: 并行化有松弛时间的任务
    const tasksWithSlack = allTasks.filter((task) => {
      const timing = taskTimings.get(task.uuid);
      return timing && timing.slack > 30 && !timing.isCritical;
    });

    tasksWithSlack.forEach((task) => {
      const timing = taskTimings.get(task.uuid)!;

      // 检查是否可以与关键任务并行
      const canParallelize = this.checkParallelizationOpportunity(
        task,
        criticalTasks,
        dependencies,
      );

      if (canParallelize) {
        suggestions.push({
          type: SuggestionType.PARALLELIZE,
          taskUuid: task.uuid,
          taskTitle: task.title,
          impact: Math.min(timing.slack, timing.duration),
          description: `"${task.title}"有 ${Math.round(timing.slack)} 分钟松弛时间，可以并行执行`,
          priority: timing.slack > 120 ? 'medium' : 'low',
        });
      }
    });

    // 建议 3: 检查是否有非必要的依赖
    criticalTasks.forEach((task) => {
      const predecessors = dependencies.filter((dep) => dep.successorTaskUuid === task.uuid);

      if (predecessors.length > 2) {
        suggestions.push({
          type: SuggestionType.REMOVE_DEPENDENCY,
          taskUuid: task.uuid,
          taskTitle: task.title,
          impact: 30, // 保守估计
          description: `"${task.title}"有 ${predecessors.length} 个前置任务，检查是否可以移除非必要依赖`,
          priority: 'low',
        });
      }
    });

    // 按影响大小排序
    suggestions.sort((a, b) => b.impact - a.impact);

    // 只返回前 5 个最有价值的建议
    return suggestions.slice(0, 5);
  }

  /**
   * 检查是否可以并行化任务
   */
  private checkParallelizationOpportunity(
    task: TaskForDAG,
    criticalTasks: TaskForDAG[],
    dependencies: TaskDependencyClientDTO[],
  ): boolean {
    // 检查该任务是否与任何关键任务有直接依赖关系
    for (const criticalTask of criticalTasks) {
      const hasDirectDependency = dependencies.some(
        (dep) =>
          (dep.predecessorTaskUuid === task.uuid && dep.successorTaskUuid === criticalTask.uuid) ||
          (dep.predecessorTaskUuid === criticalTask.uuid && dep.successorTaskUuid === task.uuid),
      );

      if (!hasDirectDependency) {
        return true; // 找到至少一个可以并行的关键任务
      }
    }

    return false;
  }

  /**
   * 格式化项目时间线信息
   */
  formatProjectTimeline(result: CriticalPathResult): ProjectTimeline {
    const timings = Array.from(result.taskTimings.values());
    const totalSlack = timings.reduce((sum, t) => sum + t.slack, 0);
    const averageSlack = timings.length > 0 ? totalSlack / timings.length : 0;

    return {
      totalDuration: result.projectDuration,
      criticalTaskCount: result.criticalTasks.length,
      totalSlack,
      averageSlack,
    };
  }

  /**
   * 检查任务是否在关键路径上
   */
  isCritical(taskUuid: string, result: CriticalPathResult): boolean {
    return result.criticalPath.includes(taskUuid);
  }

  /**
   * 获取任务的松弛时间
   */
  getSlackTime(taskUuid: string, result: CriticalPathResult): number {
    const timing = result.taskTimings.get(taskUuid);
    return timing ? timing.slack : 0;
  }
}

// 导出单例
export const taskCriticalPathService = new TaskCriticalPathService();
