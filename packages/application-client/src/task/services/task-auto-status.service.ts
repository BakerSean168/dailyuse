/**
 * Task Auto-Status Service
 *
 * 负责基于依赖关系自动更新任务状态：
 * - 当所有前置任务完成时，将后继任务从 BLOCKED → READY
 * - 当前置任务变为未完成时，将后继任务从 READY → BLOCKED
 * - 级联状态更新（通过依赖链传播）
 * - 发送通知事件
 */

import { TaskTemplateStatus, TaskType } from '@dailyuse/contracts/task';
import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  TaskDependencyServerDTO,
  TaskDependencyClientDTO,
} from '@dailyuse/contracts/task';
import type { TaskForDAG } from '../types/task-dag.types';
import mitt, { type Emitter } from 'mitt';

/**
 * 任务状态
 */
export type TaskStatus =
  | 'PENDING'
  | 'READY'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'CANCELLED';

/**
 * 状态更新结果
 */
export interface StatusUpdateResult {
  taskUuid: string;
  oldStatus: TaskStatus;
  newStatus: TaskStatus;
  reason: 'dependency_completed' | 'dependency_incomplete' | 'manual';
  affectedTasks?: string[]; // 级联影响的任务
}

/**
 * 任务就绪性分析
 */
export interface TaskReadinessAnalysis {
  taskUuid: string;
  isReady: boolean;
  totalPredecessors: number;
  completedPredecessors: number;
  incompletePredecessors: string[];
  blockingTasks: Array<{
    uuid: string;
    title?: string;
    status: string;
  }>;
}

/**
 * 事件类型
 */
type TaskStatusEvents = {
  'task:status:changed': StatusUpdateResult;
  'task:ready': { taskUuid: string; title?: string };
  'task:blocked': { taskUuid: string; blockingTasks: string[] };
};

export class TaskAutoStatusService {
  private eventBus: Emitter<TaskStatusEvents>;

  constructor() {
    // 创建事件总线
    this.eventBus = mitt<TaskStatusEvents>();
  }

  /**
   * 订阅状态变更事件
   */
  onStatusChanged(handler: (event: StatusUpdateResult) => void): () => void {
    this.eventBus.on('task:status:changed', handler);
    return () => this.eventBus.off('task:status:changed', handler);
  }

  /**
   * 订阅任务就绪事件
   */
  onTaskReady(handler: (event: { taskUuid: string; title?: string }) => void): () => void {
    this.eventBus.on('task:ready', handler);
    return () => this.eventBus.off('task:ready', handler);
  }

  /**
   * 订阅任务阻塞事件
   */
  onTaskBlocked(
    handler: (event: { taskUuid: string; blockingTasks: string[] }) => void,
  ): () => void {
    this.eventBus.on('task:blocked', handler);
    return () => this.eventBus.off('task:blocked', handler);
  }

  /**
   * 当依赖关系变化时更新任务状态
   * @param taskUuid 受影响的任务 UUID
   * @param allTasks 所有任务列表
   * @param dependencies 所有依赖关系
   */
  async updateTaskStatusOnDependencyChange(
    taskUuid: string,
    allTasks: TaskForDAG[],
    dependencies: TaskDependencyClientDTO[],
  ): Promise<StatusUpdateResult | null> {
    const task = allTasks.find((t) => t.uuid === taskUuid);
    if (!task) {
      console.warn(`Task ${taskUuid} not found`);
      return null;
    }

    // 跳过已完成或已取消的任务
    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      return null;
    }

    // 计算新状态
    const newStatus = this.calculateTaskStatus(task, allTasks, dependencies);

    // 如果状态没有变化，不更新
    if (newStatus === task.status) {
      return null;
    }

    const oldStatus = task.status as TaskStatus;

    // 更新任务状态（实际实现中应调用 API）
    // await taskApiClient.updateTaskStatus(taskUuid, newStatus);

    // 创建更新结果
    const result: StatusUpdateResult = {
      taskUuid,
      oldStatus,
      newStatus: newStatus as TaskStatus,
      reason: newStatus === 'READY' ? 'dependency_completed' : 'dependency_incomplete',
    };

    // 发送事件
    this.eventBus.emit('task:status:changed', result);

    if (newStatus === 'READY') {
      this.eventBus.emit('task:ready', {
        taskUuid,
        title: task.title,
      });
    } else if (newStatus === 'BLOCKED') {
      const analysis = this.analyzeTaskReadiness(task, allTasks, dependencies);
      this.eventBus.emit('task:blocked', {
        taskUuid,
        blockingTasks: analysis.incompletePredecessors,
      });
    }

    return result;
  }

  /**
   * 计算任务状态
   */
  calculateTaskStatus(
    task: TaskForDAG,
    allTasks: TaskForDAG[],
    dependencies: TaskDependencyClientDTO[],
  ): string {
    // 获取前置任务
    const predecessorDeps = dependencies.filter((dep) => dep.successorTaskUuid === task.uuid);

    // 如果没有前置任务
    if (predecessorDeps.length === 0) {
      // PENDING → READY
      return task.status === 'PENDING' ? 'READY' : task.status;
    }

    // 检查所有前置任务是否完成
    const allPredecessorsCompleted = predecessorDeps.every((dep) => {
      const predecessor = allTasks.find((t) => t.uuid === dep.predecessorTaskUuid);
      return predecessor?.status === 'COMPLETED';
    });

    if (allPredecessorsCompleted) {
      // 所有前置任务完成 → READY
      return task.status === 'BLOCKED' || task.status === 'PENDING' ? 'READY' : task.status;
    } else {
      // 有未完成的前置任务 → BLOCKED
      return task.status !== 'IN_PROGRESS' && task.status !== 'COMPLETED' ? 'BLOCKED' : task.status;
    }
  }

  /**
   * 级联状态更新
   * 从起始任务开始，更新其所有后继任务的状态
   */
  async cascadeStatusUpdate(
    startingTaskUuid: string,
    allTasks: TaskForDAG[],
    dependencies: TaskDependencyClientDTO[],
  ): Promise<StatusUpdateResult[]> {
    const results: StatusUpdateResult[] = [];
    const visited = new Set<string>();

    // 构建后继任务图
    const successorGraph = new Map<string, string[]>();
    dependencies.forEach((dep) => {
      if (!successorGraph.has(dep.predecessorTaskUuid)) {
        successorGraph.set(dep.predecessorTaskUuid, []);
      }
      successorGraph.get(dep.predecessorTaskUuid)!.push(dep.successorTaskUuid);
    });

    // BFS 遍历所有后继任务
    const queue: string[] = [startingTaskUuid];
    visited.add(startingTaskUuid);

    while (queue.length > 0) {
      const currentUuid = queue.shift()!;

      // 更新当前任务状态
      const result = await this.updateTaskStatusOnDependencyChange(
        currentUuid,
        allTasks,
        dependencies,
      );

      if (result) {
        results.push(result);
      }

      // 将后继任务加入队列
      const successors = successorGraph.get(currentUuid) || [];
      successors.forEach((successor) => {
        if (!visited.has(successor)) {
          visited.add(successor);
          queue.push(successor);
        }
      });
    }

    return results;
  }

  /**
   * 分析任务就绪性
   */
  analyzeTaskReadiness(
    task: TaskForDAG,
    allTasks: TaskForDAG[],
    dependencies: TaskDependencyClientDTO[],
  ): TaskReadinessAnalysis {
    // 获取前置任务
    const predecessorDeps = dependencies.filter((dep) => dep.successorTaskUuid === task.uuid);

    const predecessors = predecessorDeps.map((dep) => {
      const predecessor = allTasks.find((t) => t.uuid === dep.predecessorTaskUuid);
      return {
        uuid: dep.predecessorTaskUuid,
        title: predecessor?.title,
        status: predecessor?.status || 'UNKNOWN',
      };
    });

    const completedPredecessors = predecessors.filter((p) => p.status === 'COMPLETED');

    const incompletePredecessors = predecessors
      .filter((p) => p.status !== 'COMPLETED')
      .map((p) => p.uuid);

    const isReady = incompletePredecessors.length === 0 && predecessors.length > 0;

    return {
      taskUuid: task.uuid,
      isReady,
      totalPredecessors: predecessors.length,
      completedPredecessors: completedPredecessors.length,
      incompletePredecessors,
      blockingTasks: predecessors.filter((p) => p.status !== 'COMPLETED'),
    };
  }

  /**
   * 批量计算任务状态
   */
  batchCalculateTaskStatus(
    tasks: TaskForDAG[],
    dependencies: TaskDependencyClientDTO[],
  ): Map<string, string> {
    const statusMap = new Map<string, string>();

    tasks.forEach((task) => {
      const newStatus = this.calculateTaskStatus(task, tasks, dependencies);
      statusMap.set(task.uuid, newStatus);
    });

    return statusMap;
  }

  /**
   * 获取阻塞任务的详细信息
   */
  getBlockingTasksInfo(
    taskUuid: string,
    allTasks: TaskForDAG[],
    dependencies: TaskDependencyClientDTO[],
  ): Array<{ uuid: string; title: string; status: string; estimatedMinutes?: number | null }> {
    const predecessorDeps = dependencies.filter((dep) => dep.successorTaskUuid === taskUuid);

    return predecessorDeps
      .map((dep) => {
        const predecessor = allTasks.find((t) => t.uuid === dep.predecessorTaskUuid);
        if (!predecessor) return null;

        return {
          uuid: predecessor.uuid,
          title: predecessor.title,
          status: predecessor.status,
          estimatedMinutes: predecessor.estimatedMinutes,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null && p.status !== 'COMPLETED');
  }

  /**
   * 检查任务是否可以开始
   */
  canTaskStart(
    taskUuid: string,
    allTasks: TaskForDAG[],
    dependencies: TaskDependencyClientDTO[],
  ): { canStart: boolean; reason?: string; blockingTasks?: string[] } {
    const task = allTasks.find((t) => t.uuid === taskUuid);
    if (!task) {
      return { canStart: false, reason: '任务不存在' };
    }

    if (task.status === 'COMPLETED') {
      return { canStart: false, reason: '任务已完成' };
    }

    if (task.status === 'CANCELLED') {
      return { canStart: false, reason: '任务已取消' };
    }

    const analysis = this.analyzeTaskReadiness(task, allTasks, dependencies);

    if (!analysis.isReady && analysis.incompletePredecessors.length > 0) {
      return {
        canStart: false,
        reason: `有 ${analysis.incompletePredecessors.length} 个前置任务未完成`,
        blockingTasks: analysis.incompletePredecessors,
      };
    }

    return { canStart: true };
  }

  /**
   * 通知任务已就绪
   * 在实际实现中，这里应该发送系统通知或推送
   */
  private notifyTaskReady(taskUuid: string, taskTitle?: string): void {
    console.log(`✅ Task Ready: ${taskTitle || taskUuid}`);
    // TODO: 实现实际的通知逻辑
    // - 发送浏览器通知
    // - 发送推送通知
    // - 更新通知中心
  }
}

// 导出单例
export const taskAutoStatusService = new TaskAutoStatusService();
