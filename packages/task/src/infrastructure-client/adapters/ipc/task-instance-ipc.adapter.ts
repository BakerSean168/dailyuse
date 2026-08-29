/**
 * Task Instance IPC Adapter
 *
 * IPC implementation of ITaskInstanceApiClient for Electron desktop.
 * Uses ResultIpcClient — all methods return Result<T> directly.
 */

import type { Result } from '@memoflow/contracts/result';
import { TaskChannels } from '@memoflow/contracts/electron';
import type { ITaskInstanceApiClient, IResultIpcClient } from '../types';
import type {
  GetTaskInstancesByRangeReq,
  TaskInstanceClientDTO,
  CompleteTaskInstanceReq,
  MarkTaskInstanceMissedReq,
  SkipTaskInstanceReq,
  RescheduleTaskInput,
} from '@memoflow/contracts/task';

export class TaskInstanceIpcAdapter implements ITaskInstanceApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async getTaskInstances(params?: {
    page?: number;
    limit?: number;
    templateId?: string;
    status?: string;
  }): Promise<Result<TaskInstanceClientDTO[]>> {
    return this.ipcClient.invoke(TaskChannels.INSTANCE_LIST, params);
  }

  async getTaskInstancesByDateRange(
    request: GetTaskInstancesByRangeReq,
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    return this.ipcClient.invoke(TaskChannels.INSTANCE_LIST_BY_DATE_RANGE, request);
  }

  async getTaskInstanceById(id: string): Promise<Result<TaskInstanceClientDTO>> {
    return this.ipcClient.invoke(TaskChannels.INSTANCE_GET, { id });
  }

  async deleteTaskInstance(id: string): Promise<Result<void>> {
    return this.ipcClient.invoke(TaskChannels.INSTANCE_DELETE, { id });
  }

  async startTaskInstance(id: string): Promise<Result<TaskInstanceClientDTO>> {
    return this.ipcClient.invoke(TaskChannels.INSTANCE_CREATE, { id });
  }

  async completeTaskInstance(
    id: string,
    request?: CompleteTaskInstanceReq,
  ): Promise<Result<TaskInstanceClientDTO>> {
    return this.ipcClient.invoke(TaskChannels.INSTANCE_COMPLETE, { id, request });
  }

  async uncompleteTaskInstance(id: string): Promise<Result<TaskInstanceClientDTO>> {
    return this.ipcClient.invoke(TaskChannels.INSTANCE_UNCOMPLETE, { id });
  }

  async skipTaskInstance(
    id: string,
    request?: SkipTaskInstanceReq,
  ): Promise<Result<TaskInstanceClientDTO>> {
    return this.ipcClient.invoke(TaskChannels.INSTANCE_SKIP, { id, request });
  }

  async markTaskInstanceMissed(
    id: string,
    request?: MarkTaskInstanceMissedReq,
  ): Promise<Result<TaskInstanceClientDTO>> {
    return this.ipcClient.invoke(TaskChannels.INSTANCE_MARK_MISSED, { id, request });
  }

  async rescheduleTaskInstance(
    id: string,
    request: RescheduleTaskInput,
  ): Promise<Result<TaskInstanceClientDTO>> {
    return this.ipcClient.invoke(TaskChannels.INSTANCE_RESCHEDULE, {
      instanceId: id,
      newTime: request.newTime,
      expectedVersion: request.expectedVersion,
    });
  }
}

export function createTaskInstanceIpcAdapter(ipcClient: IResultIpcClient): TaskInstanceIpcAdapter {
  return new TaskInstanceIpcAdapter(ipcClient);
}
