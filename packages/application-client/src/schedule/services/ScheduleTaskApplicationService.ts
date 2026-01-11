/**
 * Schedule Task Application Service
 *
 * 调度任务应用服务 - 负责 ScheduleTask 的 CRUD 和状态管理
 */

import type { SourceModule } from '@dailyuse/contracts/schedule';
import type {
  ScheduleTaskClientDTO,
  CreateScheduleTaskRequest,
  ScheduleStatisticsClientDTO,
  ModuleStatisticsClientDTO,
} from '@dailyuse/contracts/schedule';
import type { IScheduleTaskApiClient } from '@dailyuse/infrastructure-client';

/**
 * Schedule Task Application Service
 */
export class ScheduleTaskApplicationService {
  constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  // ===== Schedule Task CRUD =====

  /**
   * 创建调度任务
   */
  async createTask(request: CreateScheduleTaskRequest): Promise<ScheduleTaskClientDTO> {
    return this.apiClient.createTask(request);
  }

  /**
   * 批量创建调度任务
   */
  async createTasksBatch(tasks: CreateScheduleTaskRequest[]): Promise<ScheduleTaskClientDTO[]> {
    return this.apiClient.createTasksBatch(tasks);
  }

  /**
   * 获取所有调度任务
   */
  async getTasks(): Promise<{ tasks: ScheduleTaskClientDTO[]; total: number }> {
    return this.apiClient.getTasks();
  }

  /**
   * 获取调度任务详情
   */
  async getTaskById(taskUuid: string): Promise<ScheduleTaskClientDTO> {
    return this.apiClient.getTaskById(taskUuid);
  }

  /**
   * 获取到期任务
   */
  async getDueTasks(params?: {
    beforeTime?: string;
    limit?: number;
  }): Promise<ScheduleTaskClientDTO[]> {
    return this.apiClient.getDueTasks(params);
  }

  /**
   * 根据来源获取任务
   */
  async getTaskBySource(
    sourceModule: SourceModule,
    sourceEntityId: string,
  ): Promise<ScheduleTaskClientDTO[]> {
    return this.apiClient.getTaskBySource(sourceModule, sourceEntityId);
  }

  // ===== Schedule Task Status Management =====

  /**
   * 暂停任务
   */
  async pauseTask(taskUuid: string): Promise<void> {
    return this.apiClient.pauseTask(taskUuid);
  }

  /**
   * 恢复任务
   */
  async resumeTask(taskUuid: string): Promise<void> {
    return this.apiClient.resumeTask(taskUuid);
  }

  /**
   * 完成任务
   */
  async completeTask(taskUuid: string, reason?: string): Promise<void> {
    return this.apiClient.completeTask(taskUuid, reason);
  }

  /**
   * 取消任务
   */
  async cancelTask(taskUuid: string, reason?: string): Promise<void> {
    return this.apiClient.cancelTask(taskUuid, reason);
  }

  /**
   * 删除任务
   */
  async deleteTask(taskUuid: string): Promise<void> {
    return this.apiClient.deleteTask(taskUuid);
  }

  /**
   * 批量删除任务
   */
  async deleteTasksBatch(taskUuids: string[]): Promise<void> {
    return this.apiClient.deleteTasksBatch(taskUuids);
  }

  /**
   * 更新任务元数据
   */
  async updateTaskMetadata(
    taskUuid: string,
    metadata: {
      payload?: unknown;
      tagsToAdd?: string[];
      tagsToRemove?: string[];
    },
  ): Promise<void> {
    return this.apiClient.updateTaskMetadata(taskUuid, metadata);
  }

  // ===== Schedule Statistics =====

  /**
   * 获取统计信息
   */
  async getStatistics(): Promise<ScheduleStatisticsClientDTO> {
    return this.apiClient.getStatistics();
  }

  /**
   * 获取模块统计信息
   */
  async getModuleStatistics(module: SourceModule): Promise<ModuleStatisticsClientDTO> {
    return this.apiClient.getModuleStatistics(module);
  }

  /**
   * 获取所有模块统计信息
   */
  async getAllModuleStatistics(): Promise<Record<SourceModule, ModuleStatisticsClientDTO>> {
    return this.apiClient.getAllModuleStatistics();
  }

  /**
   * 重新计算统计信息
   */
  async recalculateStatistics(): Promise<ScheduleStatisticsClientDTO> {
    return this.apiClient.recalculateStatistics();
  }

  /**
   * 重置统计信息
   */
  async resetStatistics(): Promise<void> {
    return this.apiClient.resetStatistics();
  }

  /**
   * 删除统计信息
   */
  async deleteStatistics(): Promise<void> {
    return this.apiClient.deleteStatistics();
  }
}

/**
 * Factory function to create ScheduleTaskApplicationService
 */
export function createScheduleTaskApplicationService(
  apiClient: IScheduleTaskApiClient,
): ScheduleTaskApplicationService {
  return new ScheduleTaskApplicationService(apiClient);
}
