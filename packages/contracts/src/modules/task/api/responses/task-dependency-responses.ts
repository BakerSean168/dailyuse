/**
 * Task Dependency Responses
 * 任务依赖响应类型定义
 */

import type {
  TaskDependencyServerDTO,
  TaskDependencyClientDTO,
  TaskTemplateServerDTO,
  TaskTemplateClientDTO,
} from '../../aggregates';

/**
 * 任务依赖响应
 */
export interface TaskDependencyResponse {
  dependency: TaskDependencyServerDTO | TaskDependencyClientDTO;
}

/**
 * 任务依赖列表响应
 */
export interface TaskDependenciesResponse {
  dependencies: (TaskDependencyServerDTO | TaskDependencyClientDTO)[];
  total: number;
}

/**
 * 依赖链响应
 */
export interface DependencyChainResponse {
  chain: Array<{
    task: TaskTemplateServerDTO | TaskTemplateClientDTO;
    dependencies: (TaskDependencyServerDTO | TaskDependencyClientDTO)[];
    level: number; // 层级（0 表示根任务）
  }>;
}
