/**
 * Task DAG Visualization Types
 * 任务依赖关系图可视化专用类型定义
 */

import type { TaskTemplateClientDTO, TaskInstanceClientDTO, TaskDependencyServerDTO } from '@dailyuse/contracts/task';

/**
 * 用于 DAG 可视化的任务数据类型
 * 结合了 TaskTemplate 和 TaskInstance 的信息
 */
export interface TaskForDAG {
  id: string;
  title: string;
  description?: string | null;
  status: string; // TaskInstanceStatus or TaskTemplateStatus
  priorityLevel?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priorityScore?: number; // 0-100 由后端计算
  importance?: string;
  estimatedMinutes?: number | null;
  dueDate?: string;
  tags?: string[];
  templateId?: string; // 如果是实例，指向模板
  instanceDate?: number; // 如果是实例
}

/**
 * 将 TaskTemplateClientDTO 转换为 TaskForDAG
 */
export function taskTemplateToDAG(template: TaskTemplateClientDTO): TaskForDAG {
  return {
    id: template.id,
    title: template.title,
    description: template.description,
    status: template.status,
    priorityLevel: mapPriorityScoreToLevel(template.priority),
    priorityScore: template.priority,
    importance: template.importance,
    estimatedMinutes: extractEstimatedMinutes(template.timeConfig),
    tags: template.tags,
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
    title: template?.title || `Task ${instance.id.slice(0, 8)}`,
    description: template?.description,
    status: instance.status,
    priorityLevel: template
      ? mapPriorityScoreToLevel(template.priority)
      : 'MEDIUM',
    priorityScore: template?.priority,
    importance: template?.importance,
    estimatedMinutes: extractEstimatedMinutes(instance.timeConfig),
    tags: template?.tags || [],
    templateId: instance.templateId,
    instanceDate: instance.instanceDate,
  };
}

/**
 * 将优先级分数 (0-100) 映射到优先级级别
 * 基于 Story 1.3 的算法
 */
function mapPriorityScoreToLevel(
  priorityScore?: number,
): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  if (priorityScore === undefined || priorityScore === null) return 'MEDIUM';
  
  // 优先级分数映射
  if (priorityScore >= 80) return 'CRITICAL';
  if (priorityScore >= 60) return 'HIGH';
  if (priorityScore >= 40) return 'MEDIUM';
  return 'LOW';
}

/**
 * 从 timeConfig 中提取预估时长（分钟）
 */
function extractEstimatedMinutes(timeConfig: any): number | undefined {
  if (!timeConfig) return undefined;

  // 根据实际的 timeConfig 结构提取
  // TODO: 根据实际的 TaskTimeConfig 结构调整
  if (typeof timeConfig === 'object' && timeConfig.estimatedMinutes) {
    return timeConfig.estimatedMinutes;
  }

  // 默认估算：如果有具体时间配置，估算为 30 分钟
  return 30;
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
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
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
    title: template?.title || `Task ${instance.id.slice(0, 8)}`,
    description: template?.description,
    status: instance.status,
    priority: template
      ? mapPriorityScoreToLevel(template.priority)
      : 'MEDIUM',
    priorityScore: template?.priority,
    scheduledTime: instance.timeConfig?.timePoint ?? null,
    dueDate: template?.dueDate ?? null,
    templateId: instance.templateId,
    templateTitle: template?.title,
    instanceDate: instance.instanceDate,
  };
}

