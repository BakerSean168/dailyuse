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
 */

import {
  // Template Use Cases
  listTaskTemplates,
  getTaskTemplate,
  createTaskTemplate,
  updateTaskTemplate,
  deleteTaskTemplate,
  activateTaskTemplate,
  pauseTaskTemplate,
  archiveTaskTemplate,
  // Instance Use Cases
  listTaskInstances,
  getTaskInstance,
  startTaskInstance,
  completeTaskInstance,
  skipTaskInstance,
  deleteTaskInstance,
  getInstancesByDateRange,
  // Statistics Use Cases
  getTaskStatistics,
  getTodayCompletionRate,
  getWeekCompletionRate,
  getEfficiencyTrend,
  // Dependency Use Cases
  getTaskDependencies,
  getTaskDependents,
  createTaskDependency,
  deleteTaskDependency,
  getDependencyChain,
  // Types
  type CreateTaskTemplateInput,
  type GetInstancesByDateRangeInput,
  type CreateTaskDependencyInput,
  type GetTaskStatisticsInput,
  type DeleteTaskDependencyInput,
} from '@dailyuse/application-client';
import type { UpdateTaskTemplateRequest } from '@dailyuse/contracts/task';
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
    const response = await listTaskTemplates();
    return response.templates.map(dto => TaskTemplate.fromClientDTO(dto));
  }

  /**
   * 获取单个任务模板
   * @returns 返回 Entity 对象或 null
   */
  async getTemplate(templateId: string): Promise<TaskTemplate | null> {
    try {
      const dto = await getTaskTemplate(templateId);
      return TaskTemplate.fromClientDTO(dto);
    } catch {
      return null;
    }
  }

  /**
   * 创建任务模板
   * @returns 返回创建的 Entity 对象
   */
  async createTemplate(input: CreateTaskTemplateInput): Promise<TaskTemplate> {
    const dto = await createTaskTemplate(input);
    return TaskTemplate.fromClientDTO(dto);
  }

  /**
   * 更新任务模板
   * @returns 返回更新后的 Entity 对象
   */
  async updateTemplate(uuid: string, request: UpdateTaskTemplateRequest): Promise<TaskTemplate> {
    const dto = await updateTaskTemplate(uuid, request);
    return TaskTemplate.fromClientDTO(dto);
  }

  /**
   * 删除任务模板
   */
  async deleteTemplate(templateId: string): Promise<void> {
    return deleteTaskTemplate(templateId);
  }

  /**
   * 激活任务模板
   * @returns 返回激活后的 Entity 对象
   */
  async activateTemplate(templateId: string): Promise<TaskTemplate> {
    const output = await activateTaskTemplate(templateId);
    return output.template;
  }

  /**
   * 暂停任务模板
   * @returns 返回暂停后的 Entity 对象
   */
  async pauseTemplate(templateId: string): Promise<TaskTemplate> {
    const dto = await pauseTaskTemplate(templateId);
    return TaskTemplate.fromClientDTO(dto);
  }

  /**
   * 归档任务模板
   * @returns 返回归档后的 Entity 对象
   */
  async archiveTemplate(templateId: string): Promise<TaskTemplate> {
    const dto = await archiveTaskTemplate(templateId);
    return TaskTemplate.fromClientDTO(dto);
  }

  // ===== Instance Operations =====

  /**
   * 获取所有任务实例
   * @returns 返回 Entity 对象数组
   */
  async listInstances(): Promise<TaskInstance[]> {
    const dtos = await listTaskInstances();
    return dtos.map(dto => TaskInstance.fromClientDTO(dto));
  }

  /**
   * 获取单个任务实例
   * @returns 返回 Entity 对象或 null
   */
  async getInstance(instanceId: string): Promise<TaskInstance | null> {
    try {
      const dto = await getTaskInstance(instanceId);
      return TaskInstance.fromClientDTO(dto);
    } catch {
      return null;
    }
  }

  /**
   * 开始任务实例
   * @returns 返回更新后的 Entity 对象
   */
  async startInstance(instanceId: string): Promise<TaskInstance> {
    const dto = await startTaskInstance(instanceId);
    return TaskInstance.fromClientDTO(dto);
  }

  /**
   * 完成任务实例
   * @returns 返回完成后的 Entity 对象
   */
  async completeInstance(instanceId: string): Promise<TaskInstance> {
    const dto = await completeTaskInstance(instanceId);
    return TaskInstance.fromClientDTO(dto);
  }

  /**
   * 跳过任务实例
   * @returns 返回跳过后的 Entity 对象
   */
  async skipInstance(instanceId: string): Promise<TaskInstance> {
    const dto = await skipTaskInstance(instanceId);
    return TaskInstance.fromClientDTO(dto);
  }

  /**
   * 删除任务实例
   */
  async deleteInstance(instanceId: string): Promise<void> {
    return deleteTaskInstance(instanceId);
  }

  /**
   * 获取日期范围内的任务实例
   * @returns 返回 Entity 对象数组
   */
  async getInstancesByDateRange(input: GetInstancesByDateRangeInput): Promise<TaskInstance[]> {
    const dtos = await getInstancesByDateRange(input);
    return dtos.map(dto => TaskInstance.fromClientDTO(dto));
  }

  // ===== Statistics =====

  /**
   * 获取任务统计数据
   * @returns 返回 Entity 对象或 null
   */
  async getStatistics(input: GetTaskStatisticsInput): Promise<TaskStatistics | null> {
    try {
      const dto = await getTaskStatistics(input);
      return TaskStatistics.fromServerDTO(dto);
    } catch {
      return null;
    }
  }

  /**
   * 获取今日完成率
   */
  async getTodayCompletionRate(accountUuid: string): Promise<number> {
    return getTodayCompletionRate(accountUuid);
  }

  /**
   * 获取本周完成率
   */
  async getWeekCompletionRate(accountUuid: string): Promise<number> {
    return getWeekCompletionRate(accountUuid);
  }

  /**
   * 获取效率趋势
   */
  async getEfficiencyTrend(accountUuid: string) {
    return getEfficiencyTrend(accountUuid);
  }

  // ===== Dependencies =====

  async getDependencies(templateId: string) {
    return getTaskDependencies(templateId);
  }

  async getDependents(templateId: string) {
    return getTaskDependents(templateId);
  }

  async createDependency(input: CreateTaskDependencyInput) {
    return createTaskDependency(input);
  }

  async deleteDependency(input: DeleteTaskDependencyInput) {
    return deleteTaskDependency(input);
  }

  async getDependencyChain(templateId: string) {
    return getDependencyChain(templateId);
  }
}

// 导出单例实例
export const taskApplicationService = TaskApplicationService.getInstance();
