/**
 * Task DAG Visualization Types
 * 任务依赖关系图可视化专用类型定义
 */

import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  TaskGraphDependencyDTO,
  TaskTimeConfigDTO,
  DependencyStatus,
  DependencyType,
} from '@memoflow/contracts/task';
import { PriorityLevel } from '@memoflow/contracts/shared';

/**
 * 用于 DAG 可视化的任务数据类型
 * 结合了 TaskTemplate 和 TaskInstance 的信息
 */
export interface TaskForDAG {
  id: string;
  title: string;
  description?: string | null;
  status: string; // TaskInstanceStatus or TaskTemplateStatus
  priorityLevel?: PriorityLevel;
  priorityScore?: number; // 0-100 由后端计算
  importance?: string;
  estimatedMinutes?: number | null;
  dueDate?: string;
  tags?: string[];
  parentTaskId?: string | null;
  dependencyStatus?: DependencyStatus;
  isBlocked?: boolean;
  blockingReason?: string | null;
  templateId?: string; // 如果是实例，指向模板
  instanceDate?: number; // 如果是实例
}

export const TaskGraphEdgeKind = {
  Dependency: 'dependency',
  Hierarchy: 'hierarchy',
} as const;
export type TaskGraphEdgeKind = (typeof TaskGraphEdgeKind)[keyof typeof TaskGraphEdgeKind];

export interface TaskGraphEdge {
  id: string;
  source: string;
  target: string;
  kind: TaskGraphEdgeKind;
  dependencyType?: DependencyType;
  lagDays?: number;
}

export interface TaskGraphData {
  nodes: TaskForDAG[];
  edges: TaskGraphEdge[];
  dependencyEdges: TaskGraphEdge[];
  hierarchyEdges: TaskGraphEdge[];
}

/**
 * 将 TaskTemplateClientDTO 转换为 TaskForDAG
 */
export function taskTemplateToDAG(template: TaskTemplateClientDTO): TaskForDAG {
  return {
    id: template.id,
    title: template.name,
    description: template.description,
    status: template.status,
    priorityLevel: mapPriorityScoreToLevel(template.priority),
    priorityScore: template.priority,
    importance: template.importance,
    estimatedMinutes: extractEstimatedMinutes(template.estimatedMinutes, template.timeConfig),
    dueDate: template.dueDate ? String(template.dueDate) : undefined,
    tags: template.tags,
    parentTaskId: template.parentTaskId,
    dependencyStatus: template.dependencyStatus as DependencyStatus | undefined,
    isBlocked: template.isBlocked,
    blockingReason: template.blockingReason,
  };
}

/**
 * 将 TaskInstanceClientDTO 转换为 TaskForDAG
 */
export function taskInstanceToDAG(
  instance: TaskInstanceClientDTO,
  template?: TaskTemplateClientDTO,
): TaskForDAG {
  return {
    id: instance.id,
    title: template?.name || `Task ${instance.id.slice(0, 8)}`,
    description: template?.description,
    status: instance.status,
    priorityLevel: template ? mapPriorityScoreToLevel(template.priority) : PriorityLevel.Medium,
    priorityScore: template?.priority,
    importance: template?.importance,
    estimatedMinutes: extractEstimatedMinutes(template?.estimatedMinutes, instance.timeConfig),
    dueDate: template?.dueDate ? String(template.dueDate) : undefined,
    tags: template?.tags || [],
    parentTaskId: template?.parentTaskId,
    dependencyStatus: template?.dependencyStatus as DependencyStatus | undefined,
    isBlocked: template?.isBlocked,
    blockingReason: template?.blockingReason,
    templateId: instance.templateId,
    instanceDate: instance.instanceDate,
  };
}

export function buildTaskGraphData(
  templates: TaskTemplateClientDTO[],
  dependencies: TaskGraphDependencyDTO[],
): TaskGraphData {
  const nodes = templates.map((template) => taskTemplateToDAG(template));
  const nodeIds = new Set(nodes.map((node) => node.id));

  const hierarchyEdges = nodes
    .filter((node) => node.parentTaskId && nodeIds.has(node.parentTaskId))
    .map((node) => ({
      id: `hierarchy:${node.parentTaskId}:${node.id}`,
      source: node.parentTaskId!,
      target: node.id,
      kind: TaskGraphEdgeKind.Hierarchy,
    }));

  const dependencyEdges = dependencies
    .filter(
      (dependency) =>
        nodeIds.has(dependency.predecessorTaskId) && nodeIds.has(dependency.successorTaskId),
    )
    .map((dependency) => ({
      id: dependency.id,
      source: dependency.predecessorTaskId,
      target: dependency.successorTaskId,
      kind: TaskGraphEdgeKind.Dependency,
      dependencyType: dependency.dependencyType,
      lagDays: dependency.lagDays,
    }));

  return {
    nodes,
    edges: [...hierarchyEdges, ...dependencyEdges],
    dependencyEdges,
    hierarchyEdges,
  };
}

/**
 * 将优先级分数 (0-100) 映射到优先级级别
 * 基于 Story 1.3 的算法
 */
function mapPriorityScoreToLevel(priorityScore?: number): PriorityLevel {
  if (priorityScore === undefined || priorityScore === null) return PriorityLevel.Medium;

  // 优先级分数映射
  if (priorityScore >= 80) return PriorityLevel.Critical;
  if (priorityScore >= 60) return PriorityLevel.High;
  if (priorityScore >= 40) return PriorityLevel.Medium;
  return PriorityLevel.Low;
}

/**
 * 从 timeConfig 中提取预估时长（分钟）
 */
function extractEstimatedMinutes(
  estimatedMinutes: number | null | undefined,
  timeConfig: TaskTimeConfigDTO | null | undefined,
): number | undefined {
  if (estimatedMinutes !== undefined && estimatedMinutes !== null) {
    return estimatedMinutes;
  }

  if (timeConfig?.timeType === 'TimeRange' && timeConfig.timeRange) {
    return Math.max(0, timeConfig.timeRange.end - timeConfig.timeRange.start);
  }

  return undefined;
}

/**
 * 用于 Widget 显示的任务类型
 * 结合了 TaskInstance 和 TaskTemplate 的显示信息
 */
export interface TaskForWidget {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: PriorityLevel;
  priorityScore?: number;
  scheduledTime?: number | null;
  dueDate?: number | null;
  templateId: string;
  templateTitle?: string;
  instanceDate: number;
}

/**
 * 将 TaskInstanceClientDTO 和 TaskTemplateClientDTO 转换为 TaskForWidget
 */
export function taskInstanceToWidget(
  instance: TaskInstanceClientDTO,
  template?: TaskTemplateClientDTO,
): TaskForWidget {
  return {
    id: instance.id,
    title: template?.name || `Task ${instance.id.slice(0, 8)}`,
    description: template?.description,
    status: instance.status,
    priority: template ? mapPriorityScoreToLevel(template.priority) : PriorityLevel.Medium,
    priorityScore: template?.priority,
    scheduledTime: instance.timeConfig?.timePoint ?? null,
    dueDate: template?.dueDate ?? null,
    templateId: instance.templateId,
    templateTitle: template?.name,
    instanceDate: instance.instanceDate,
  };
}
