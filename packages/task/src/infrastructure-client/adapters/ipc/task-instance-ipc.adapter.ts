/**
 * Task Instance IPC Adapter
 *
 * IPC implementation of ITaskInstanceApiClient for Electron desktop.
 * Uses ResultIpcClient — all methods return Result<T> directly.
 */

import type { Result } from '@dailyuse/contracts/result';
import type {
  ITaskInstanceApiClient,
  IResultIpcClient,
} from '../types';
import type {
  TaskInstanceClientDTO,
  CompleteTaskInstanceReq,
  SkipTaskInstanceReq,
} from '@dailyuse/contracts/task';

export class TaskInstanceIpcAdapter implements ITaskInstanceApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async getTaskInstances(params?: {
    page?: number;
    limit?: number;
    templateId?: string;
    status?: string;
    startDate?: number;
    endDate?: number;
  }): Promise<Result<TaskInstanceClientDTO[]>> {
    return this.ipcClient.invoke('task:instance:list', params);
  }

  async getTaskInstanceById(id: string): Promise<Result<TaskInstanceClientDTO>> {
    return this.ipcClient.invoke('task:instance:get', { id });
  }

  async deleteTaskInstance(id: string): Promise<Result<void>> {
    return this.ipcClient.invoke('task:instance:delete', { id });
  }

  async startTaskInstance(id: string): Promise<Result<TaskInstanceClientDTO>> {
    return this.ipcClient.invoke('task:instance:create', { id });
  }

  async completeTaskInstance(
    id: string,
    request?: CompleteTaskInstanceReq,
  ): Promise<Result<TaskInstanceClientDTO>> {
    return this.ipcClient.invoke('task:instance:complete', { id, request });
  }

  async skipTaskInstance(
    id: string,
    request?: SkipTaskInstanceReq,
  ): Promise<Result<TaskInstanceClientDTO>> {
    return this.ipcClient.invoke('task:instance:skip', { id, request });
  }

  async checkExpiredInstances(): Promise<Result<{
    count: number;
    instances: TaskInstanceClientDTO[];
  }>> {
    return this.ipcClient.invoke('task:instance:check-expired');
  }
}

export function createTaskInstanceIpcAdapter(ipcClient: IResultIpcClient): TaskInstanceIpcAdapter {
  return new TaskInstanceIpcAdapter(ipcClient);
}
