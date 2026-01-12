/**
 * Task Application Service - Renderer
 *
 * 任务应用服务 - 渲染进程
 *
 * 职责：
 * - 调用 @dailyuse/application-client 的 Task Use Cases
 * - 将 DTO 转换为 Entity 对象
 * - 不包含业务逻辑
 * 
 * 🔄 重构说明 (EPIC-015):
 * - 所有返回 DTO 的方法改为返回 Entity
 * - 使用 Entity.fromClientDTO() 进行转换
 * - 与 Web 应用 ApplicationService 模式保持一致
 * 
 * 🔄 Contract First 重构:
 * - 从 @dailyuse/contracts/task 导入类型
 * - 使用 Service 类代替便捷函数
 */

import {
  // Template Use Cases
  ListTaskTemplates,
  GetTaskTemplate,
  CreateTaskTemplate,
  UpdateTaskTemplate,
  DeleteTaskTemplate,
  ActivateTaskTemplate,
  PauseTaskTemplate,
  ArchiveTaskTemplate,
  // Instance Use Cases
  ListTaskInstances,
  GetTaskInstance,
  StartTaskInstance,
  CompleteTaskInstance,
  SkipTaskInstance,
  DeleteTaskInstance,
  GetInstancesByDateRange,
  // Statistics Use Cases
  GetTaskStatistics,
  GetTodayCompletionRate,
  GetWeekCompletionRate,
  GetEfficiencyTrend,
  // Dependency Use Cases
  GetTaskDependencies,
  GetTaskDependents,
  CreateTaskDependency,
  DeleteTaskDependency,
  GetDependencyChain,
} from '@dailyuse/application-client';
import type {
  CreateTaskTemplateRequest,
  UpdateTaskTemplateRequest,
  CreateTaskDependencyRequest,
} from '@dailyuse/contracts/task';
import { TaskTemplate, TaskInstance, TaskStatistics } from '@dailyuse/domain-client/task';

/**
 * Task Application Service
 */
export class TaskApplicationService {
  private static instance: TaskApplicationService;

  private constructor() {}

  static getInstance(): TaskApplicationService {
    if (!TaskApplicationService.instance) {
      TaskApplicationService.instance = new TaskApplicationService();
    }
    return TaskApplicationService.instance;
  }

  // ===== Template Operations =====

  /**
   * 获取所有任务模板
   * @returns 返回 Entity 对象数组
   */
  async listTemplates(): Promise<TaskTemplate[]> {
    return ListTaskTemplates.getInstance().execute();
  }

  /**
   * 获取单个任务模板
   * @returns 返回 Entity 对象或 null
   */
  async getTemplate(templateId: string): Promise<TaskTemplate | null> {
    try {
      return GetTaskTemplate.getInstance().execute(templateId);
    } catch {
      return null;
    }
  }

  /**
   * 创建任务模板
   * @returns 返回创建的 Entity 对象
   */
  async createTemplate(request: CreateTaskTemplateRequest): Promise<TaskTemplate> {
    return CreateTaskTemplate.getInstance().execute(request);
  }

  /**
   * 更新任务模板
   * @returns 返回更新后的 Entity 对象
   */
  async updateTemplate(uuid: string, request: UpdateTaskTemplateRequest): Promise<TaskTemplate> {
    return UpdateTaskTemplate.getInstance().execute(uuid, request);
  }

  /**
   * 删除任务模板
   */
  async deleteTemplate(templateId: string): Promise<void> {
    return DeleteTaskTemplate.getInstance().execute(templateId);
  }

  /**
   * 激活任务模板
   * @returns 返回激活后的 Entity 对象
   */
  async activateTemplate(templateId: string): Promise<TaskTemplate> {
    const output = await ActivateTaskTemplate.getInstance().execute(templateId);
    return output.template;
  }

  /**
   * 暂停任务模板
   * @returns 返回暂停后的 Entity 对象
   */
  async pauseTemplate(templateId: string): Promise<TaskTemplate> {
    return PauseTaskTemplate.getInstance().execute(templateId);
  }

  /**
   * 归档任务模板
   * @returns 返回归档后的 Entity 对象
   */
  async archiveTemplate(templateId: string): Promise<TaskTemplate> {
    return ArchiveTaskTemplate.getInstance().execute(templateId);
  }

  // ===== Instance Operations =====

  /**
   * 获取所有任务实例
   * @returns 返回 Entity 对象数组
   */
  async listInstances(): Promise<TaskInstance[]> {
    return ListTaskInstances.getInstance().execute();
  }

  /**
   * 获取单个任务实例
   * @returns 返回 Entity 对象或 null
   */
  async getInstance(instanceId: string): Promise<TaskInstance | null> {
    try {
      return GetTaskInstance.getInstance().execute(instanceId);
    } catch {
      return null;
    }
  }

  /**
   * 开始任务实例
   * @returns 返回更新后的 Entity 对象
   */
  async startInstance(instanceId: string): Promise<TaskInstance> {
    return StartTaskInstance.getInstance().execute(instanceId);
  }

  /**
   * 完成任务实例
   * @returns 返回完成后的 Entity 对象
   */
  async completeInstance(instanceId: string): Promise<TaskInstance> {
    return CompleteTaskInstance.getInstance().execute(instanceId);
  }

  /**
   * 跳过任务实例
   * @returns 返回跳过后的 Entity 对象
   */
  async skipInstance(instanceId: string): Promise<TaskInstance> {
    return SkipTaskInstance.getInstance().execute(instanceId);
  }

  /**
   * 删除任务实例
   */
  async deleteInstance(instanceId: string): Promise<void> {
    return DeleteTaskInstance.getInstance().execute(instanceId);
  }

  /**
   * 获取日期范围内的任务实例
   * @returns 返回 Entity 对象数组
   */
  async getInstancesByDateRange(input: { templateUuid: string; from: number; to: number }): Promise<TaskInstance[]> {
    return GetInstancesByDateRange.getInstance().execute(input.templateUuid, input.from, input.to);
  }

  // ===== Statistics =====

  /**
   * 获取任务统计数据
   * @returns 返回 Entity 对象或 null
   */
  async getStatistics(input: { accountUuid: string; forceRecalculate?: boolean }): Promise<TaskStatistics | null> {
    try {
      const dto = await GetTaskStatistics.getInstance().execute(input.accountUuid, input.forceRecalculate);
      return TaskStatistics.fromServerDTO(dto);
    } catch {
      return null;
    }
  }

  /**
   * 获取今日完成率
   */
  async getTodayCompletionRate(accountUuid: string): Promise<number> {
    return GetTodayCompletionRate.getInstance().execute(accountUuid);
  }

  /**
   * 获取本周完成率
   */
  async getWeekCompletionRate(accountUuid: string): Promise<number> {
    return GetWeekCompletionRate.getInstance().execute(accountUuid);
  }

  /**
   * 获取效率趋势
   */
  async getEfficiencyTrend(accountUuid: string) {
    return GetEfficiencyTrend.getInstance().execute(accountUuid);
  }

  // ===== Dependencies =====

  async getDependencies(templateId: string) {
    return GetTaskDependencies.getInstance().execute(templateId);
  }

  async getDependents(templateId: string) {
    return GetTaskDependents.getInstance().execute(templateId);
  }

  async createDependency(taskUuid: string, request: CreateTaskDependencyRequest) {
    return CreateTaskDependency.getInstance().execute(taskUuid, request);
  }

  async deleteDependency(uuid: string, taskUuid: string) {
    return DeleteTaskDependency.getInstance().execute(uuid, taskUuid);
  }

  async getDependencyChain(templateId: string) {
    return GetDependencyChain.getInstance().execute(templateId);
  }
}

// 导出单例实例
export const taskApplicationService = TaskApplicationService.getInstance();
