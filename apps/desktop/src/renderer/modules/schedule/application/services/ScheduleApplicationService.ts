/**
 * Schedule Application Service - Renderer
 *
 * 日程应用服务 - 渲染进程
 * 
 * EPIC-015 重构: 添加 DTO→Entity 转换
 * - 所有返回值使用 Entity 类型
 * - 使用 Entity.fromClientDTO() 进行转换
 */

import {
  // Schedule Task Use Cases
  listScheduleTasks,
  getScheduleTask,
  createScheduleTask,
  pauseScheduleTask,
  resumeScheduleTask,
  completeScheduleTask,
  cancelScheduleTask,
  deleteScheduleTask,
  deleteScheduleTasksBatch,
  createScheduleTasksBatch,
  getDueTasks,
  getTaskBySource,
  updateTaskMetadata,
  getScheduleStatistics,
  getModuleStatistics,
  getAllModuleStatistics,
  recalculateStatistics,
  resetStatistics,
  deleteStatistics,
  // Schedule Event Use Cases
  createScheduleEvent,
  getScheduleEvent,
  listSchedulesByAccount,
  getSchedulesByTimeRange,
  updateScheduleEvent,
  deleteScheduleEvent,
  // Types
  type CreateScheduleTaskInput,
  type CreateScheduleTasksBatchInput,
  type GetDueTasksInput,
  type GetTaskBySourceInput,
  type CompleteScheduleTaskInput,
  type CancelScheduleTaskInput,
  type UpdateTaskMetadataInput,
  type CreateScheduleEventInput,
  type GetSchedulesByTimeRangeInput,
  type UpdateScheduleEventInput,
} from '@dailyuse/application-client';
import type {
  ScheduleClientDTO,
  SourceModule,
} from '@dailyuse/contracts/schedule';
import { ScheduleTask } from '@dailyuse/domain-client/schedule';

/**
 * Schedule Application Service
 */
export class ScheduleApplicationService {
  private static instance: ScheduleApplicationService;

  private constructor() {}

  static getInstance(): ScheduleApplicationService {
    if (!ScheduleApplicationService.instance) {
      ScheduleApplicationService.instance = new ScheduleApplicationService();
    }
    return ScheduleApplicationService.instance;
  }

  // ===== Schedule Task Operations =====

  /**
   * 获取所有调度任务
   * @returns 返回 Entity 对象数组
   */
  async listScheduleTasks(): Promise<ScheduleTask[]> {
    const response = await listScheduleTasks();
    // listScheduleTasks返回 {tasks: DTO[], total: number}
    const tasks = Array.isArray(response) ? response : (response as any)?.tasks || [];
    return tasks.map(dto => ScheduleTask.fromClientDTO(dto));
  }

  /**
   * 获取单个调度任务
   * @returns 返回 Entity 对象或 null
   */
  async getScheduleTask(taskId: string): Promise<ScheduleTask | null> {
    try {
      const dto = await getScheduleTask(taskId);
      return ScheduleTask.fromClientDTO(dto);
    } catch {
      return null;
    }
  }

  /**
   * 创建调度任务
   * @returns 返回创建的 Entity 对象
   */
  async createScheduleTask(input: CreateScheduleTaskInput): Promise<ScheduleTask> {
    const dto = await createScheduleTask(input);
    return ScheduleTask.fromClientDTO(dto);
  }

  /**
   * 批量创建调度任务
   * @returns 返回创建的 Entity 对象数组
   */
  async createScheduleTasksBatch(input: CreateScheduleTasksBatchInput): Promise<ScheduleTask[]> {
    const dtos = await createScheduleTasksBatch(input);
    return dtos.map(dto => ScheduleTask.fromClientDTO(dto));
  }

  async pauseScheduleTask(taskId: string): Promise<void> {
    return pauseScheduleTask(taskId);
  }

  async resumeScheduleTask(taskId: string): Promise<void> {
    return resumeScheduleTask(taskId);
  }

  async completeScheduleTask(input: CompleteScheduleTaskInput): Promise<void> {
    return completeScheduleTask(input);
  }

  async cancelScheduleTask(input: CancelScheduleTaskInput): Promise<void> {
    return cancelScheduleTask(input);
  }

  async deleteScheduleTask(taskId: string): Promise<void> {
    return deleteScheduleTask(taskId);
  }

  async deleteScheduleTasksBatch(taskIds: string[]): Promise<void> {
    return deleteScheduleTasksBatch(taskIds);
  }

  /**
   * 获取到期任务
   * @returns 返回 Entity 对象数组
   */
  async getDueTasks(input: GetDueTasksInput): Promise<ScheduleTask[]> {
    const dtos = await getDueTasks(input);
    return dtos.map(dto => ScheduleTask.fromClientDTO(dto));
  }

  /**
   * 根据来源获取任务
   * @returns 返回 Entity 对象数组
   */
  async getTaskBySource(input: GetTaskBySourceInput): Promise<ScheduleTask[]> {
    const dtos = await getTaskBySource(input);
    return dtos.map(dto => ScheduleTask.fromClientDTO(dto));
  }

  async updateTaskMetadata(input: UpdateTaskMetadataInput): Promise<void> {
    return updateTaskMetadata(input);
  }

  // ===== Statistics Operations =====

  async getScheduleStatistics() {
    return getScheduleStatistics();
  }

  async getModuleStatistics(module: SourceModule) {
    return getModuleStatistics(module);
  }

  async getAllModuleStatistics() {
    return getAllModuleStatistics();
  }

  async recalculateStatistics() {
    return recalculateStatistics();
  }

  async resetStatistics(): Promise<void> {
    return resetStatistics();
  }

  async deleteStatistics(): Promise<void> {
    return deleteStatistics();
  }

  // ===== Schedule Event Operations =====

  async createScheduleEvent(input: CreateScheduleEventInput): Promise<ScheduleClientDTO> {
    return createScheduleEvent(input);
  }

  async getScheduleEvent(eventId: string): Promise<ScheduleClientDTO | null> {
    try {
      return await getScheduleEvent(eventId);
    } catch {
      return null;
    }
  }

  async listSchedulesByAccount(): Promise<ScheduleClientDTO[]> {
    return listSchedulesByAccount();
  }

  async getSchedulesByTimeRange(input: GetSchedulesByTimeRangeInput): Promise<ScheduleClientDTO[]> {
    return getSchedulesByTimeRange(input);
  }

  async updateScheduleEvent(input: UpdateScheduleEventInput): Promise<ScheduleClientDTO> {
    return updateScheduleEvent(input);
  }

  async deleteScheduleEvent(eventId: string): Promise<void> {
    return deleteScheduleEvent(eventId);
  }
}

// Singleton instance
export const scheduleApplicationService = ScheduleApplicationService.getInstance();
