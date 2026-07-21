/**
 * Schedule Task IPC Adapter
 *
 * IPC implementation of IScheduleTaskApiClient for Electron desktop apps.
 * Uses ResultIpcClient — all methods return Result<T> directly.
 */

import type { Result } from '@dailyuse/contracts/result';
import { ScheduleChannels } from '@dailyuse/contracts/electron';
import type {
  IResultIpcClient,
  IScheduleTaskApiClient,
} from '../types';
import type { SourceModule } from '@dailyuse/contracts/schedule';
import type {
  ScheduleTaskClientDTO,
  BatchOperationResponseDTO,
  CreateScheduleTaskRequest,
  UpdateTaskMetadataRequest,
} from '@dailyuse/contracts/schedule';

export class ScheduleTaskIpcAdapter implements IScheduleTaskApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  // ===== Schedule Task CRUD =====

  async createTask(request: CreateScheduleTaskRequest): Promise<Result<ScheduleTaskClientDTO>> {
    return this.ipcClient.invoke(ScheduleChannels.TASK_CREATE, request);
  }

  async createTasksBatch(tasks: CreateScheduleTaskRequest[]): Promise<Result<ScheduleTaskClientDTO[]>> {
    return this.ipcClient.invoke(ScheduleChannels.TASK_CREATE_BATCH, tasks);
  }

  async getTasks(): Promise<Result<ScheduleTaskClientDTO[]>> {
    return this.ipcClient.invoke(ScheduleChannels.TASK_LIST);
  }

  async getTaskById(taskId: string): Promise<Result<ScheduleTaskClientDTO>> {
    return this.ipcClient.invoke(ScheduleChannels.TASK_GET_BY_ID, taskId);
  }

  async getDueTasks(params?: {
    beforeTime?: string;
    limit?: number;
  }): Promise<Result<ScheduleTaskClientDTO[]>> {
    return this.ipcClient.invoke(ScheduleChannels.TASK_GET_DUE, params);
  }

  async getTaskBySource(
    sourceModule: SourceModule,
    sourceEntityId: string,
  ): Promise<Result<ScheduleTaskClientDTO[]>> {
    return this.ipcClient.invoke(ScheduleChannels.TASK_GET_BY_SOURCE, sourceModule, sourceEntityId);
  }

  // ===== Schedule Task Status Management =====

  async pauseTask(taskId: string): Promise<Result<ScheduleTaskClientDTO>> {
    return this.ipcClient.invoke(ScheduleChannels.TASK_PAUSE, taskId);
  }

  async resumeTask(taskId: string): Promise<Result<ScheduleTaskClientDTO>> {
    return this.ipcClient.invoke(ScheduleChannels.TASK_RESUME, taskId);
  }

  async completeTask(taskId: string, reason?: string): Promise<Result<ScheduleTaskClientDTO>> {
    return this.ipcClient.invoke(ScheduleChannels.TASK_COMPLETE, taskId, reason);
  }

  async cancelTask(taskId: string, reason?: string): Promise<Result<ScheduleTaskClientDTO>> {
    return this.ipcClient.invoke(ScheduleChannels.TASK_CANCEL, taskId, reason);
  }

  async deleteTask(taskId: string): Promise<Result<void>> {
    return this.ipcClient.invoke(ScheduleChannels.TASK_DELETE, taskId);
  }

  async deleteTasksBatch(taskIds: string[]): Promise<Result<BatchOperationResponseDTO>> {
    return this.ipcClient.invoke(ScheduleChannels.TASK_DELETE_BATCH, taskIds);
  }

  async updateTaskMetadata(taskId: string, metadata: UpdateTaskMetadataRequest): Promise<Result<ScheduleTaskClientDTO>> {
    return this.ipcClient.invoke(ScheduleChannels.TASK_UPDATE_METADATA, taskId, metadata);
  }
}

export function createScheduleTaskIpcAdapter(ipcClient: IResultIpcClient): ScheduleTaskIpcAdapter {
  return new ScheduleTaskIpcAdapter(ipcClient);
}
