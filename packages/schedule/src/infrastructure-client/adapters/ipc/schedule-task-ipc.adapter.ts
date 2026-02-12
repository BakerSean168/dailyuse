/**
 * Schedule Task IPC Adapter
 *
 * IPC implementation of IScheduleTaskApiClient for Electron desktop apps.
 */

import type {
  IIpcClient,
  IScheduleTaskApiClient,
  ScheduleStatisticsClientDTO,
  ModuleStatisticsClientDTO,
} from '../types';
import type { SourceModule } from '@dailyuse/contracts/schedule';
import type {
  ScheduleTaskClientDTO,
  CreateScheduleTaskRequest,
} from '@dailyuse/contracts/schedule';

/**
 * IPC channel definitions for Schedule Task operations
 */
const SCHEDULE_TASK_CHANNELS = {
  // CRUD
  CREATE_TASK: 'schedule:task:create',
  CREATE_TASKS_BATCH: 'schedule:task:create-batch',
  GET_TASKS: 'schedule:task:list',
  GET_TASK_BY_ID: 'schedule:task:get-by-id',
  GET_DUE_TASKS: 'schedule:task:get-due',
  GET_TASK_BY_SOURCE: 'schedule:task:get-by-source',
  // Status Management
  PAUSE_TASK: 'schedule:task:pause',
  RESUME_TASK: 'schedule:task:resume',
  COMPLETE_TASK: 'schedule:task:complete',
  CANCEL_TASK: 'schedule:task:cancel',
  DELETE_TASK: 'schedule:task:delete',
  DELETE_TASKS_BATCH: 'schedule:task:delete-batch',
  UPDATE_METADATA: 'schedule:task:update-metadata',
  // Statistics
  GET_STATISTICS: 'schedule:statistics:get',
  GET_MODULE_STATISTICS: 'schedule:statistics:get-module',
  GET_ALL_MODULE_STATISTICS: 'schedule:statistics:get-all-modules',
  RECALCULATE_STATISTICS: 'schedule:statistics:recalculate',
  RESET_STATISTICS: 'schedule:statistics:reset',
  DELETE_STATISTICS: 'schedule:statistics:delete',
} as const;

export class ScheduleTaskIpcAdapter implements IScheduleTaskApiClient {
  constructor(private readonly ipcClient: IIpcClient) {}

  // ===== Schedule Task CRUD =====

  async createTask(request: CreateScheduleTaskRequest): Promise<ScheduleTaskClientDTO> {
    return this.ipcClient.invoke(SCHEDULE_TASK_CHANNELS.CREATE_TASK, request);
  }

  async createTasksBatch(tasks: CreateScheduleTaskRequest[]): Promise<ScheduleTaskClientDTO[]> {
    return this.ipcClient.invoke(SCHEDULE_TASK_CHANNELS.CREATE_TASKS_BATCH, tasks);
  }

  async getTasks(): Promise<{ tasks: ScheduleTaskClientDTO[]; total: number }> {
    return this.ipcClient.invoke(SCHEDULE_TASK_CHANNELS.GET_TASKS);
  }

  async getTaskById(taskUuid: string): Promise<ScheduleTaskClientDTO> {
    return this.ipcClient.invoke(SCHEDULE_TASK_CHANNELS.GET_TASK_BY_ID, taskUuid);
  }

  async getDueTasks(params?: {
    beforeTime?: string;
    limit?: number;
  }): Promise<ScheduleTaskClientDTO[]> {
    return this.ipcClient.invoke(SCHEDULE_TASK_CHANNELS.GET_DUE_TASKS, params);
  }

  async getTaskBySource(
    sourceModule: SourceModule,
    sourceEntityId: string,
  ): Promise<ScheduleTaskClientDTO[]> {
    return this.ipcClient.invoke(SCHEDULE_TASK_CHANNELS.GET_TASK_BY_SOURCE, sourceModule, sourceEntityId);
  }

  // ===== Schedule Task Status Management =====

  async pauseTask(taskUuid: string): Promise<void> {
    await this.ipcClient.invoke(SCHEDULE_TASK_CHANNELS.PAUSE_TASK, taskUuid);
  }

  async resumeTask(taskUuid: string): Promise<void> {
    await this.ipcClient.invoke(SCHEDULE_TASK_CHANNELS.RESUME_TASK, taskUuid);
  }

  async completeTask(taskUuid: string, reason?: string): Promise<void> {
    await this.ipcClient.invoke(SCHEDULE_TASK_CHANNELS.COMPLETE_TASK, taskUuid, reason);
  }

  async cancelTask(taskUuid: string, reason?: string): Promise<void> {
    await this.ipcClient.invoke(SCHEDULE_TASK_CHANNELS.CANCEL_TASK, taskUuid, reason);
  }

  async deleteTask(taskUuid: string): Promise<void> {
    await this.ipcClient.invoke(SCHEDULE_TASK_CHANNELS.DELETE_TASK, taskUuid);
  }

  async deleteTasksBatch(taskUuids: string[]): Promise<void> {
    await this.ipcClient.invoke(SCHEDULE_TASK_CHANNELS.DELETE_TASKS_BATCH, taskUuids);
  }

  async updateTaskMetadata(
    taskUuid: string,
    metadata: {
      payload?: unknown;
      tagsToAdd?: string[];
      tagsToRemove?: string[];
    },
  ): Promise<void> {
    await this.ipcClient.invoke(SCHEDULE_TASK_CHANNELS.UPDATE_METADATA, taskUuid, metadata);
  }

  // ===== Schedule Statistics =====

  async getStatistics(): Promise<ScheduleStatisticsClientDTO> {
    return this.ipcClient.invoke(SCHEDULE_TASK_CHANNELS.GET_STATISTICS);
  }

  async getModuleStatistics(module: SourceModule): Promise<ModuleStatisticsClientDTO> {
    return this.ipcClient.invoke(SCHEDULE_TASK_CHANNELS.GET_MODULE_STATISTICS, module);
  }

  async getAllModuleStatistics(): Promise<Record<SourceModule, ModuleStatisticsClientDTO>> {
    return this.ipcClient.invoke(SCHEDULE_TASK_CHANNELS.GET_ALL_MODULE_STATISTICS);
  }

  async recalculateStatistics(): Promise<ScheduleStatisticsClientDTO> {
    return this.ipcClient.invoke(SCHEDULE_TASK_CHANNELS.RECALCULATE_STATISTICS);
  }

  async resetStatistics(): Promise<void> {
    await this.ipcClient.invoke(SCHEDULE_TASK_CHANNELS.RESET_STATISTICS);
  }

  async deleteStatistics(): Promise<void> {
    await this.ipcClient.invoke(SCHEDULE_TASK_CHANNELS.DELETE_STATISTICS);
  }
}

/**
 * Factory function to create ScheduleTaskIpcAdapter
 */
export function createScheduleTaskIpcAdapter(ipcClient: IIpcClient): ScheduleTaskIpcAdapter {
  return new ScheduleTaskIpcAdapter(ipcClient);
}
