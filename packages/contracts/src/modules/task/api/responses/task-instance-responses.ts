/**
 * Task Instance Responses
 * 任务实例响应类型定义
 */

import type {
  TaskInstanceServerDTO,
  TaskInstanceClientDTO,
  TaskTemplateServerDTO,
  TaskTemplateClientDTO,
  TaskDependencyServerDTO,
  TaskDependencyClientDTO,
} from '../../aggregates';

/**
 * 任务实例响应
 */
export interface TaskInstanceResponse {
  instance: TaskInstanceServerDTO | TaskInstanceClientDTO;
}

/**
 * 任务实例列表响应
 */
export interface TaskInstancesResponse {
  instances: (TaskInstanceServerDTO | TaskInstanceClientDTO)[];
  total: number;
  page?: number;
  pageSize?: number;
}

/**
 * 检查过期实例响应
 */
export interface CheckExpiredInstancesResponse {
  count: number;
  instances: (TaskInstanceServerDTO | TaskInstanceClientDTO)[];
}

/**
 * 任务实例聚合视图响应
 */
export interface TaskInstanceAggregateViewResponse {
  instance: TaskInstanceServerDTO | TaskInstanceClientDTO;
  template: TaskTemplateServerDTO | TaskTemplateClientDTO;
  dependencies?: (TaskDependencyServerDTO | TaskDependencyClientDTO)[];
}
