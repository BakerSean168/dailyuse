/**
 * Task Application Service
 *
 * Smart Container + Application Service Pattern
 * Framework-agnostic orchestration layer for task management
 *
 * ✅ Centralized in packages - no duplication
 * ✅ Direct import from apps/web and apps/desktop
 * ✅ Handles cross-module coordination
 * ✅ Single instance for application lifecycle
 *
 * @module application-client/task
 */

import type { TaskTemplate } from '../domain-client/aggregates/task-template';
import type { TaskInstance } from '../domain-client/aggregates/task-instance';
import type { TaskDependency } from '../domain-client/aggregates/task-dependency';
import type {
  CreateTaskTemplateRequest,
  UpdateTaskTemplateRequest,
  CreateTaskInstanceRequest,
  UpdateTaskInstanceRequest,
  CreateTaskDependencyRequest,
  UpdateTaskDependencyRequest,
  GetInstancesByDateRangeRequest,
  GetFocusHistoryRequest,
} from '@dailyuse/contracts/task';
import {
  // Task Template Use Cases
  CreateTaskTemplate,
  ListTaskTemplates,
  GetTaskTemplate,
  UpdateTaskTemplate,
  DeleteTaskTemplate,
  ActivateTaskTemplate,
  PauseTaskTemplate,
  ArchiveTaskTemplate,
  GenerateTaskInstances,
  GetInstancesByDateRange,
  BindTaskToGoal,
  UnbindTaskFromGoal,
  // Task Instance Use Cases
  ListTaskInstances,
  GetTaskInstance,
  DeleteTaskInstance,
  StartTaskInstance,
  CompleteTaskInstance,
  SkipTaskInstance,
  CheckExpiredInstances,
  // Task Dependency Use Cases
  CreateTaskDependency,
  GetTaskDependencies,
  GetTaskDependents,
  GetDependencyChain,
  ValidateTaskDependency,
  UpdateTaskDependency,
  DeleteTaskDependency,
  // Task Statistics Use Cases
  GetTaskStatistics,
  GetTodayCompletionRate,
  GetWeekCompletionRate,
} from './services';

/**
 * Task Application Service - Smart Container
 *
 * Orchestrates all task-related use cases with a unified API.
 * Framework-agnostic: works with Vue Composables and React Hooks equally.
 *
 * @example
 * // In Vue Composable
 * import { taskApplicationService } from '@/'
 * const template = await taskApplicationService.createTemplate(request)
 *
 * @example
 * // In React Hook (identical!)
 * import { taskApplicationService } from '@/'
 * const template = await taskApplicationService.createTemplate(request)
 */
export class TaskApplicationService {
  // ===== Task Template Operations =====

  /**
   * 创建任务模板
   */
  async createTemplate(request: CreateTaskTemplateRequest): Promise<TaskTemplate> {
    return CreateTaskTemplate.getInstance().execute(request);
  }

  /**
   * 获取任务模板列表
   */
  async listTemplates(): Promise<TaskTemplate[]> {
    return ListTaskTemplates.getInstance().execute();
  }

  /**
   * 获取单个任务模板
   */
  async getTemplate(uuid: string): Promise<TaskTemplate> {
    return GetTaskTemplate.getInstance().execute(uuid);
  }

  /**
   * 更新任务模板
   */
  async updateTemplate(uuid: string, request: UpdateTaskTemplateRequest): Promise<TaskTemplate> {
    return UpdateTaskTemplate.getInstance().execute(uuid, request);
  }

  /**
   * 删除任务模板
   */
  async deleteTemplate(uuid: string): Promise<void> {
    return DeleteTaskTemplate.getInstance().execute(uuid);
  }

  /**
   * 激活任务模板
   */
  async activateTemplate(uuid: string): Promise<TaskTemplate> {
    return ActivateTaskTemplate.getInstance().execute(uuid);
  }

  /**
   * 暂停任务模板
   */
  async pauseTemplate(uuid: string): Promise<TaskTemplate> {
    return PauseTaskTemplate.getInstance().execute(uuid);
  }

  /**
   * 归档任务模板
   */
  async archiveTemplate(uuid: string): Promise<TaskTemplate> {
    return ArchiveTaskTemplate.getInstance().execute(uuid);
  }

  /**
   * 生成任务实例
   */
  async generateInstances(templateUuid: string, request?: any): Promise<TaskInstance[]> {
    return GenerateTaskInstances.getInstance().execute(templateUuid, request);
  }

  /**
   * 绑定任务到目标
   */
  async bindToGoal(taskUuid: string, goalUuid: string): Promise<void> {
    return BindTaskToGoal.getInstance().execute(taskUuid, goalUuid);
  }

  /**
   * 解绑任务从目标
   */
  async unbindFromGoal(taskUuid: string): Promise<void> {
    return UnbindTaskFromGoal.getInstance().execute(taskUuid);
  }

  // ===== Task Instance Operations =====

  /**
   * 获取任务实例列表
   */
  async listInstances(filters?: any): Promise<TaskInstance[]> {
    return ListTaskInstances.getInstance().execute(filters);
  }

  /**
   * 获取单个任务实例
   */
  async getInstance(uuid: string): Promise<TaskInstance> {
    return GetTaskInstance.getInstance().execute(uuid);
  }

  /**
   * 删除任务实例
   */
  async deleteInstance(uuid: string): Promise<void> {
    return DeleteTaskInstance.getInstance().execute(uuid);
  }

  /**
   * 开始任务实例
   */
  async startInstance(uuid: string): Promise<TaskInstance> {
    return StartTaskInstance.getInstance().execute(uuid);
  }

  /**
   * 完成任务实例
   */
  async completeInstance(uuid: string, notes?: string): Promise<TaskInstance> {
    return CompleteTaskInstance.getInstance().execute(uuid, notes);
  }

  /**
   * 跳过任务实例
   */
  async skipInstance(uuid: string, reason?: string): Promise<TaskInstance> {
    return SkipTaskInstance.getInstance().execute(uuid, reason);
  }

  /**
   * 检查过期的任务实例
   */
  async checkExpiredInstances(): Promise<TaskInstance[]> {
    return CheckExpiredInstances.getInstance().execute();
  }

  /**
   * 按日期范围获取任务实例
   */
  async getInstancesByDateRange(request: GetInstancesByDateRangeRequest): Promise<TaskInstance[]> {
    return GetInstancesByDateRange.getInstance().execute(request);
  }

  /**
   * 获取今天的任务实例
   */
  async getTodayInstances(): Promise<TaskInstance[]> {
    return GetInstancesByDateRange.getInstance().getTodayInstances();
  }

  /**
   * 获取本周的任务实例
   */
  async getWeekInstances(): Promise<TaskInstance[]> {
    return GetInstancesByDateRange.getInstance().getWeekInstances();
  }

  // ===== Task Dependency Operations =====

  /**
   * 创建任务依赖
   */
  async createDependency(request: CreateTaskDependencyRequest): Promise<TaskDependency> {
    return CreateTaskDependency.getInstance().execute(request);
  }

  /**
   * 获取任务的所有依赖
   */
  async getDependencies(taskUuid: string): Promise<TaskDependency[]> {
    return GetTaskDependencies.getInstance().execute(taskUuid);
  }

  /**
   * 获取依赖于该任务的所有任务
   */
  async getDependents(taskUuid: string): Promise<TaskDependency[]> {
    return GetTaskDependents.getInstance().execute(taskUuid);
  }

  /**
   * 获取依赖链
   */
  async getDependencyChain(taskUuid: string): Promise<TaskDependency[]> {
    return GetDependencyChain.getInstance().execute(taskUuid);
  }

  /**
   * 验证任务依赖
   */
  async validateDependency(request: CreateTaskDependencyRequest): Promise<boolean> {
    return ValidateTaskDependency.getInstance().execute(request);
  }

  /**
   * 更新任务依赖
   */
  async updateDependency(
    uuid: string,
    request: UpdateTaskDependencyRequest,
  ): Promise<TaskDependency> {
    return UpdateTaskDependency.getInstance().execute(uuid, request);
  }

  /**
   * 删除任务依赖
   */
  async deleteDependency(uuid: string): Promise<void> {
    return DeleteTaskDependency.getInstance().execute(uuid);
  }

  // ===== Task Statistics Operations =====

  /**
   * 获取任务统计信息
   */
  async getStatistics(filters?: any): Promise<any> {
    return GetTaskStatistics.getInstance().execute(filters);
  }

  /**
   * 获取今天的完成率
   */
  async getTodayCompletionRate(): Promise<number> {
    return GetTodayCompletionRate.getInstance().execute();
  }

  /**
   * 获取本周的完成率
   */
  async getWeekCompletionRate(): Promise<number> {
    return GetWeekCompletionRate.getInstance().execute();
  }
}

/**
 * Task Application Service 单例实例
 */
export const taskApplicationService = new TaskApplicationService();
