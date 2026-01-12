/**
 * Schedule Application Service - Renderer
 *
 * 日程应用服务 - 渲染进程
 * 
 * EPIC-015 重构: 已完成 DTO→Entity 优化
 * 
 * application-client 已返回 Entity 对象，本服务直接透传：
 * - ScheduleTask Entity（调度任务）
 * - Schedule Entity（日程事件/日历）
 * 
 * Contract First Pattern:
 * - 使用 Service 类的 getInstance().execute() 模式
 * - 类型从 @dailyuse/contracts/schedule 导入
 */

import {
  // Schedule Task Use Cases
  ListScheduleTasks,
  GetScheduleTask,
  CreateScheduleTask,
  PauseScheduleTask,
  ResumeScheduleTask,
  CompleteScheduleTask,
  CancelScheduleTask,
  DeleteScheduleTask,
  DeleteScheduleTasksBatch,
  CreateScheduleTasksBatch,
  GetDueTasks,
  GetTaskBySource,
  UpdateTaskMetadata,
  GetScheduleStatistics,
  GetModuleStatistics,
  GetAllModuleStatistics,
  RecalculateStatistics,
  ResetStatistics,
  DeleteStatistics,
  // Schedule Event Use Cases
  CreateScheduleEvent,
  GetScheduleEvent,
  ListSchedulesByAccount,
  GetSchedulesByTimeRange,
  UpdateScheduleEvent,
  DeleteScheduleEvent,
} from '@dailyuse/application-client';
import type {
  SourceModule,
  CreateScheduleTaskRequest,
  CreateScheduleRequest,
  GetSchedulesByTimeRangeRequest,
  UpdateScheduleRequest,
  UpdateTaskMetadataRequest,
} from '@dailyuse/contracts/schedule';
import type { ScheduleTask, Schedule } from '@dailyuse/domain-client/schedule';

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
    const response = await ListScheduleTasks.getInstance().execute();
    return response.tasks;
  }

  /**
   * 获取单个调度任务
   * @returns 返回 Entity 对象或 null
   */
  async getScheduleTask(taskId: string): Promise<ScheduleTask | null> {
    try {
      return await GetScheduleTask.getInstance().execute(taskId);
    } catch {
      return null;
    }
  }

  /**
   * 创建调度任务
   * @returns 返回创建的 Entity 对象
   */
  async createScheduleTask(input: CreateScheduleTaskRequest): Promise<ScheduleTask> {
    return CreateScheduleTask.getInstance().execute(input);
  }

  /**
   * 批量创建调度任务
   * @returns 返回创建的 Entity 对象数组
   */
  async createScheduleTasksBatch(input: CreateScheduleTaskRequest[]): Promise<ScheduleTask[]> {
    return CreateScheduleTasksBatch.getInstance().execute(input);
  }

  async pauseScheduleTask(taskId: string): Promise<void> {
    return PauseScheduleTask.getInstance().execute(taskId);
  }

  async resumeScheduleTask(taskId: string): Promise<void> {
    return ResumeScheduleTask.getInstance().execute(taskId);
  }

  async completeScheduleTask(taskUuid: string, reason?: string): Promise<void> {
    return CompleteScheduleTask.getInstance().execute(taskUuid, reason);
  }

  async cancelScheduleTask(taskUuid: string, reason?: string): Promise<void> {
    return CancelScheduleTask.getInstance().execute(taskUuid, reason);
  }

  async deleteScheduleTask(taskId: string): Promise<void> {
    return DeleteScheduleTask.getInstance().execute(taskId);
  }

  async deleteScheduleTasksBatch(taskIds: string[]): Promise<void> {
    return DeleteScheduleTasksBatch.getInstance().execute(taskIds);
  }

  /**
   * 获取到期任务
   * @returns 返回 Entity 对象数组
   */
  async getDueTasks(beforeTime?: string, limit?: number): Promise<ScheduleTask[]> {
    return GetDueTasks.getInstance().execute(beforeTime, limit);
  }

  /**
   * 根据来源获取任务
   * @returns 返回 Entity 对象数组
   */
  async getTaskBySource(sourceModule: SourceModule, sourceEntityId: string): Promise<ScheduleTask[]> {
    return GetTaskBySource.getInstance().execute(sourceModule, sourceEntityId);
  }

  async updateTaskMetadata(taskUuid: string, metadata: UpdateTaskMetadataRequest): Promise<void> {
    return UpdateTaskMetadata.getInstance().execute(taskUuid, metadata);
  }

  // ===== Statistics Operations =====

  async getScheduleStatistics() {
    return GetScheduleStatistics.getInstance().execute();
  }

  async getModuleStatistics(module: SourceModule) {
    return GetModuleStatistics.getInstance().execute(module);
  }

  async getAllModuleStatistics() {
    return GetAllModuleStatistics.getInstance().execute();
  }

  async recalculateStatistics() {
    return RecalculateStatistics.getInstance().execute();
  }

  async resetStatistics(): Promise<void> {
    return ResetStatistics.getInstance().execute();
  }

  async deleteStatistics(): Promise<void> {
    return DeleteStatistics.getInstance().execute();
  }

  // ===== Schedule Event Operations =====

  async createScheduleEvent(input: CreateScheduleRequest): Promise<Schedule> {
    return CreateScheduleEvent.getInstance().execute(input);
  }

  async getScheduleEvent(eventId: string): Promise<Schedule | null> {
    try {
      return await GetScheduleEvent.getInstance().execute(eventId);
    } catch {
      return null;
    }
  }

  async listSchedulesByAccount(): Promise<Schedule[]> {
    return ListSchedulesByAccount.getInstance().execute();
  }

  async getSchedulesByTimeRange(input: GetSchedulesByTimeRangeRequest): Promise<Schedule[]> {
    return GetSchedulesByTimeRange.getInstance().execute(input);
  }

  async updateScheduleEvent(uuid: string, data: UpdateScheduleRequest): Promise<Schedule> {
    return UpdateScheduleEvent.getInstance().execute(uuid, data);
  }

  async deleteScheduleEvent(eventId: string): Promise<void> {
    return DeleteScheduleEvent.getInstance().execute(eventId);
  }
}

// Singleton instance
export const scheduleApplicationService = ScheduleApplicationService.getInstance();
