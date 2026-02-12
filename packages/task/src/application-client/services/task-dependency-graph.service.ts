/**
 * Task Dependency Graph Service
 *
 * 负责将任务依赖数据转换为 ECharts Graph 可视化格式
 * 并提供关键路径计算、拓扑排序等图算法功能
 */

import type { TaskTemplateClientDTO, TaskInstanceClientDTO, TaskDependencyServerDTO, TaskDependencyClientDTO } from '@dailyuse/contracts/task';
import type { TaskForDAG } from '../types/task-dag.types';

// 类型别名，简化代码
type TaskClientDTO = TaskForDAG;

/**
 * ECharts Graph 节点数据
 */
export interface GraphNode {
  id: string; // 任务 UUID
  name: string; // 任务标题
  value: number; // 节点大小（基于任务权重/优先级）
  category: number; // 分类索引（用于图例）
  symbolSize: number; // 节点显示大小
  x?: number; // 自定义布局 X 坐标
  y?: number; // 自定义布局 Y 坐标
  label?: {
    show: boolean;
    formatter?: string;
  };
  itemStyle: {
    color: string; // 节点颜色（基于任务状态）
    borderColor?: string; // 边框颜色（关键路径高亮）
    borderWidth?: number; // 边框宽度
  };
  emphasis?: {
    itemStyle?: {
      borderColor?: string;
      borderWidth?: number;
    };
  };
  // 附加任务信息（用于 tooltip）
  task: {
    uuid: string;
    title: string;
    status: string;
    priority?: string;
    estimatedMinutes?: number | null;
    dueDate?: string;
    tags?: string[];
  };
  // 关键路径标记
  isCritical?: boolean;
}

/**
 * ECharts Graph 边数据
 */
export interface GraphEdge {
  source: string; // 前置任务 UUID
  target: string; // 后继任务 UUID
  value: string; // 依赖类型（FS, SS, FF, SF）
  lineStyle: {
    color: string; // 边颜色
    width: number; // 边宽度
    type: 'solid' | 'dashed' | 'dotted'; // 边样式
  };
  label?: {
    show: boolean;
    formatter?: string;
  };
  // 关键路径标记
  isCritical?: boolean;
}

/**
 * 图数据结构
 */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  categories: Array<{ name: string; itemStyle?: { color: string } }>;
}

/**
 * 关键路径结果
 */
export interface CriticalPathResult {
  path: string[]; // 关键路径任务 UUID 列表
  duration: number; // 关键路径总时长（分钟）
  edges: Array<{ source: string; target: string }>; // 关键路径边
}

/**
 * 任务状态颜色映射（符合 Material Design 规范）
 */
const TASK_STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#52C41A', // Green - 已完成
  IN_PROGRESS: '#1890FF', // Blue - 进行中
  READY: '#FAAD14', // Yellow - 就绪（所有前置任务已完成）
  BLOCKED: '#F5222D', // Red - 阻塞（前置任务未完成）
  PENDING: '#D9D9D9', // Gray - 待处理
};

/**
 * 任务优先级颜色映射
 */
const TASK_PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#F5222D', // Red
  HIGH: '#FF9800', // Orange
  MEDIUM: '#FAAD14', // Yellow
  LOW: '#52C41A', // Green
};

/**
 * 依赖类型显示名称
 */
const DEPENDENCY_TYPE_LABELS: Record<string, string> = {
  FS: 'FS', // Finish-to-Start
  SS: 'SS', // Start-to-Start
  FF: 'FF', // Finish-to-Finish
  SF: 'SF', // Start-to-Finish
};

export class TaskDependencyGraphService {
  /**
   * 将任务和依赖数据转换为 ECharts Graph 格式
   */
  transformToGraphData(tasks: TaskClientDTO[], dependencies: TaskDependencyClientDTO[]): GraphData {
    // 创建任务 UUID 到任务对象的映射
    const taskMap = new Map<string, TaskClientDTO>();
    tasks.forEach((task) => taskMap.set(task.uuid, task));

    // 计算每个任务的依赖状态
    const taskDependencyStatus = this.calculateDependencyStatus(tasks, dependencies);

    // 转换节点
    const nodes: GraphNode[] = tasks.map((task) => {
      const status = taskDependencyStatus.get(task.uuid) || 'PENDING';
      const color = this.getTaskColor(task, status);
      const symbolSize = this.calculateNodeSize(task);
      const priority = task.priorityLevel || 'MEDIUM';

      return {
        id: task.uuid,
        name: task.title,
        value:
          priority === 'CRITICAL'
            ? 100
            : priority === 'HIGH'
              ? 75
              : priority === 'MEDIUM'
                ? 50
                : 25,
        category: this.getTaskCategory(task),
        symbolSize,
        label: {
          show: true,
          formatter: task.title,
        },
        itemStyle: {
          color,
          borderWidth: 2,
          borderColor: 'transparent',
        },
        emphasis: {
          itemStyle: {
            borderWidth: 4,
            borderColor: '#1890FF',
          },
        },
        task: {
          uuid: task.uuid,
          title: task.title,
          status: task.status,
          priority: task.priorityLevel,
          estimatedMinutes: task.estimatedMinutes,
          dueDate: task.dueDate,
          tags: task.tags || [],
        },
        isCritical: false,
      };
    });

    // 转换边
    const edges: GraphEdge[] = dependencies.map((dep) => ({
      source: dep.predecessorTaskUuid,
      target: dep.successorTaskUuid,
      value: dep.dependencyType,
      lineStyle: {
        color: '#999',
        width: 2,
        type: 'solid',
      },
      label: {
        show: true,
        formatter: DEPENDENCY_TYPE_LABELS[dep.dependencyType] || dep.dependencyType,
      },
      isCritical: false,
    }));

    // 分类（用于图例）
    const categories = [
      { name: '已完成', itemStyle: { color: TASK_STATUS_COLORS.COMPLETED } },
      { name: '进行中', itemStyle: { color: TASK_STATUS_COLORS.IN_PROGRESS } },
      { name: '就绪', itemStyle: { color: TASK_STATUS_COLORS.READY } },
      { name: '阻塞', itemStyle: { color: TASK_STATUS_COLORS.BLOCKED } },
      { name: '待处理', itemStyle: { color: TASK_STATUS_COLORS.PENDING } },
    ];

    return { nodes, edges, categories };
  }

  /**
   * 计算每个任务的依赖状态
   * - COMPLETED: 任务已完成
   * - IN_PROGRESS: 任务正在进行中
   * - READY: 所有前置任务已完成，可以开始
   * - BLOCKED: 有前置任务未完成
   * - PENDING: 默认状态
   */
  private calculateDependencyStatus(
    tasks: TaskClientDTO[],
    dependencies: TaskDependencyClientDTO[],
  ): Map<string, string> {
    const statusMap = new Map<string, string>();
    const taskMap = new Map<string, TaskClientDTO>();
    tasks.forEach((task) => {
      taskMap.set(task.uuid, task);
      statusMap.set(task.uuid, task.status);
    });

    // 构建前置任务映射
    const predecessorMap = new Map<string, string[]>();
    dependencies.forEach((dep) => {
      const predecessors = predecessorMap.get(dep.successorTaskUuid) || [];
      predecessors.push(dep.predecessorTaskUuid);
      predecessorMap.set(dep.successorTaskUuid, predecessors);
    });

    // 计算每个任务的状态
    tasks.forEach((task) => {
      if (task.status === 'COMPLETED') {
        statusMap.set(task.uuid, 'COMPLETED');
        return;
      }

      if (task.status === 'IN_PROGRESS') {
        statusMap.set(task.uuid, 'IN_PROGRESS');
        return;
      }

      const predecessors = predecessorMap.get(task.uuid) || [];
      if (predecessors.length === 0) {
        // 没有前置任务，状态为 READY
        statusMap.set(task.uuid, task.status === 'PENDING' ? 'READY' : task.status);
        return;
      }

      // 检查前置任务是否全部完成
      const allPredecessorsCompleted = predecessors.every((predUuid) => {
        const predTask = taskMap.get(predUuid);
        return predTask?.status === 'COMPLETED';
      });

      if (allPredecessorsCompleted) {
        statusMap.set(task.uuid, 'READY');
      } else {
        statusMap.set(task.uuid, 'BLOCKED');
      }
    });

    return statusMap;
  }

  /**
   * 获取任务颜色（基于状态）
   */
  private getTaskColor(task: TaskClientDTO, dependencyStatus: string): string {
    // 优先使用依赖状态
    if (dependencyStatus === 'COMPLETED') return TASK_STATUS_COLORS.COMPLETED;
    if (dependencyStatus === 'IN_PROGRESS') return TASK_STATUS_COLORS.IN_PROGRESS;
    if (dependencyStatus === 'READY') return TASK_STATUS_COLORS.READY;
    if (dependencyStatus === 'BLOCKED') return TASK_STATUS_COLORS.BLOCKED;

    // 回退到任务本身的状态
    return TASK_STATUS_COLORS[task.status] || TASK_STATUS_COLORS.PENDING;
  }

  /**
   * 计算节点大小（基于任务优先级和预估时长）
   */
  private calculateNodeSize(task: TaskClientDTO): number {
    let baseSize = 50;

    // 根据优先级调整大小
    const priority = task.priorityLevel || 'MEDIUM';
    if (priority === 'CRITICAL') baseSize += 20;
    else if (priority === 'HIGH') baseSize += 10;

    // 根据预估时长调整大小（可选）
    if (task.estimatedMinutes) {
      const hours = task.estimatedMinutes / 60;
      if (hours > 8) baseSize += 15;
      else if (hours > 4) baseSize += 10;
      else if (hours > 2) baseSize += 5;
    }

    return Math.min(baseSize, 100); // 最大 100
  }

  /**
   * 获取任务分类索引（用于 ECharts 图例）
   */
  private getTaskCategory(task: TaskClientDTO): number {
    if (task.status === 'COMPLETED') return 0;
    if (task.status === 'IN_PROGRESS') return 1;
    // READY, BLOCKED, PENDING 需要通过依赖状态判断，这里先返回默认值
    return 4; // PENDING
  }

  /**
   * 计算关键路径（使用最长路径算法）
   * 关键路径是从起始任务到结束任务的最长路径
   */
  calculateCriticalPath(
    tasks: TaskClientDTO[],
    dependencies: TaskDependencyClientDTO[],
  ): CriticalPathResult {
    // 构建任务映射
    const taskMap = new Map<string, TaskClientDTO>();
    tasks.forEach((task) => taskMap.set(task.uuid, task));

    // 构建邻接表（前驱 -> 后继）
    const adjacencyList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    tasks.forEach((task) => {
      adjacencyList.set(task.uuid, []);
      inDegree.set(task.uuid, 0);
    });

    dependencies.forEach((dep) => {
      const successors = adjacencyList.get(dep.predecessorTaskUuid) || [];
      successors.push(dep.successorTaskUuid);
      adjacencyList.set(dep.predecessorTaskUuid, successors);

      inDegree.set(dep.successorTaskUuid, (inDegree.get(dep.successorTaskUuid) || 0) + 1);
    });

    // 找到起始节点（入度为 0）
    const startNodes = tasks.filter((task) => inDegree.get(task.uuid) === 0);
    if (startNodes.length === 0) {
      // 可能存在循环依赖
      return { path: [], duration: 0, edges: [] };
    }

    // 使用拓扑排序 + 动态规划计算最长路径
    const longestDistance = new Map<string, number>();
    const parent = new Map<string, string | null>();

    tasks.forEach((task) => {
      longestDistance.set(task.uuid, 0);
      parent.set(task.uuid, null);
    });

    // 拓扑排序
    const queue: string[] = [];
    const currentInDegree = new Map(inDegree);

    startNodes.forEach((node) => {
      queue.push(node.uuid);
      longestDistance.set(node.uuid, taskMap.get(node.uuid)?.estimatedMinutes || 0);
    });

    const topologicalOrder: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      topologicalOrder.push(current);

      const successors = adjacencyList.get(current) || [];
      successors.forEach((successor) => {
        // 更新最长距离
        const currentTask = taskMap.get(current);
        const successorTask = taskMap.get(successor);
        const currentDistance = longestDistance.get(current) || 0;
        const edgeWeight = currentTask?.estimatedMinutes || 0;
        const newDistance = currentDistance + edgeWeight;

        if (newDistance > (longestDistance.get(successor) || 0)) {
          longestDistance.set(successor, newDistance);
          parent.set(successor, current);
        }

        // 减少入度
        const newInDegree = (currentInDegree.get(successor) || 0) - 1;
        currentInDegree.set(successor, newInDegree);

        if (newInDegree === 0) {
          queue.push(successor);
        }
      });
    }

    // 找到结束节点（出度为 0 且最长距离最大）
    let maxDistance = 0;
    let endNode: string | null = null;

    tasks.forEach((task) => {
      const successors = adjacencyList.get(task.uuid) || [];
      if (successors.length === 0) {
        const distance = longestDistance.get(task.uuid) || 0;
        if (distance > maxDistance) {
          maxDistance = distance;
          endNode = task.uuid;
        }
      }
    });

    if (!endNode) {
      return { path: [], duration: 0, edges: [] };
    }

    // 回溯构建关键路径
    const path: string[] = [];
    const edges: Array<{ source: string; target: string }> = [];
    let current: string | null = endNode;

    while (current !== null) {
      path.unshift(current);
      const pred = parent.get(current);
      if (pred) {
        edges.unshift({ source: pred, target: current });
      }
      current = pred || null;
    }

    // 加上最后一个任务的时长
    const endTask = taskMap.get(endNode);
    const totalDuration = maxDistance + (endTask?.estimatedMinutes || 0);

    return {
      path,
      duration: totalDuration,
      edges,
    };
  }

  /**
   * 高亮关键路径
   */
  highlightCriticalPath(graphData: GraphData, criticalPath: CriticalPathResult): GraphData {
    const criticalNodeIds = new Set(criticalPath.path);
    const criticalEdgeMap = new Map(
      criticalPath.edges.map((edge) => [`${edge.source}-${edge.target}`, true]),
    );

    // 高亮节点
    graphData.nodes.forEach((node) => {
      if (criticalNodeIds.has(node.id)) {
        node.isCritical = true;
        node.itemStyle.borderColor = '#F5222D'; // 红色边框
        node.itemStyle.borderWidth = 4;
      }
    });

    // 高亮边
    graphData.edges.forEach((edge) => {
      const edgeKey = `${edge.source}-${edge.target}`;
      if (criticalEdgeMap.has(edgeKey)) {
        edge.isCritical = true;
        edge.lineStyle.color = '#F5222D'; // 红色
        edge.lineStyle.width = 4;
        edge.lineStyle.type = 'solid';
      }
    });

    return graphData;
  }

  /**
   * 拓扑排序（用于检测循环依赖）
   */
  topologicalSort(
    tasks: TaskClientDTO[],
    dependencies: TaskDependencyClientDTO[],
  ): { sorted: string[]; hasCycle: boolean } {
    const adjacencyList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    tasks.forEach((task) => {
      adjacencyList.set(task.uuid, []);
      inDegree.set(task.uuid, 0);
    });

    dependencies.forEach((dep) => {
      const successors = adjacencyList.get(dep.predecessorTaskUuid) || [];
      successors.push(dep.successorTaskUuid);
      adjacencyList.set(dep.predecessorTaskUuid, successors);

      inDegree.set(dep.successorTaskUuid, (inDegree.get(dep.successorTaskUuid) || 0) + 1);
    });

    const queue: string[] = [];
    tasks.forEach((task) => {
      if (inDegree.get(task.uuid) === 0) {
        queue.push(task.uuid);
      }
    });

    const sorted: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      sorted.push(current);

      const successors = adjacencyList.get(current) || [];
      successors.forEach((successor) => {
        const newInDegree = (inDegree.get(successor) || 0) - 1;
        inDegree.set(successor, newInDegree);

        if (newInDegree === 0) {
          queue.push(successor);
        }
      });
    }

    // 如果排序后的节点数小于总节点数，说明存在循环依赖
    const hasCycle = sorted.length < tasks.length;

    return { sorted, hasCycle };
  }
}

// 导出单例
export const taskDependencyGraphService = new TaskDependencyGraphService();

