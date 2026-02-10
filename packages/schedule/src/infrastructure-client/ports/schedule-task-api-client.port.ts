/**
 * Schedule Task API Client Port
 *
 * 定义调度任务 API 客户端接口。
 * 用于管理定时任务、提醒等调度相关功能。
 */

import type { SourceModule } from '@dailyuse/contracts/schedule';
import type {
  ScheduleTaskClientDTO,
  CreateScheduleTaskRequest,
} from '@dailyuse/contracts/schedule';

/**
 * 调度统计信息 DTO（合约包暂未定义，临时本地声明）
 */
export interface ScheduleStatisticsClientDTO {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  pausedTasks: number;
}

export interface ModuleStatisticsClientDTO {
  module: SourceModule;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
}

/**
 * IScheduleTaskApiClient
 *
 * 调度任务 API 客户端接口
 */
export interface IScheduleTaskApiClient {
  // ===== Schedule Task CRUD =====

  /**
   * 创建调度任务
   */
  createTask(request: CreateScheduleTaskRequest): Promise<ScheduleTaskClientDTO>;

  /**
   * 批量创建调度任务
   */
  createTasksBatch(tasks: CreateScheduleTaskRequest[]): Promise<ScheduleTaskClientDTO[]>;

  /**
   * 获取调度任务列表
   */
  getTasks(): Promise<{ tasks: ScheduleTaskClientDTO[]; total: number }>;

  /**
   * 获取调度任务详情
   */
  getTaskById(taskUuid: string): Promise<ScheduleTaskClientDTO>;

  /**
   * 查找待执行任务
   */
  getDueTasks(params?: {
    beforeTime?: string;
    limit?: number;
  }): Promise<ScheduleTaskClientDTO[]>;

  /**
   * 根据来源模块和实体ID获取任务
   */
  getTaskBySource(
    sourceModule: SourceModule,
    sourceEntityId: string,
  ): Promise<ScheduleTaskClientDTO[]>;

  // ===== Schedule Task Status Management =====

  /**
   * 暂停任务
   */
  pauseTask(taskUuid: string): Promise<void>;

  /**
   * 恢复任务
   */
  resumeTask(taskUuid: string): Promise<void>;

  /**
   * 完成任务
   */
  completeTask(taskUuid: string, reason?: string): Promise<void>;

  /**
   * 取消任务
   */
  cancelTask(taskUuid: string, reason?: string): Promise<void>;

  /**
   * 删除任务
   */
  deleteTask(taskUuid: string): Promise<void>;

  /**
   * 批量删除任务
   */
  deleteTasksBatch(taskUuids: string[]): Promise<void>;

  /**
   * 更新任务元数据
   */
  updateTaskMetadata(
    taskUuid: string,
    metadata: {
      payload?: unknown;
      tagsToAdd?: string[];
      tagsToRemove?: string[];
    },
  ): Promise<void>;

  // ===== Schedule Statistics =====

  /**
   * 获取统计信息
   */
  getStatistics(): Promise<ScheduleStatisticsClientDTO>;

  /**
   * 获取模块级别统计
   */
  getModuleStatistics(module: SourceModule): Promise<ModuleStatisticsClientDTO>;

  /**
   * 获取所有模块统计
   */
  getAllModuleStatistics(): Promise<Record<SourceModule, ModuleStatisticsClientDTO>>;

  /**
   * 重新计算统计信息
   */
  recalculateStatistics(): Promise<ScheduleStatisticsClientDTO>;

  /**
   * 重置统计信息
   */
  resetStatistics(): Promise<void>;

  /**
   * 删除统计信息
   */
  deleteStatistics(): Promise<void>;
}
