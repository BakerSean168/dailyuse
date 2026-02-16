/**
 * Task Instance IPC Adapter
 *
 * IPC implementation of ITaskInstanceApiClient for Electron desktop.
 */

import type { Result } from '@dailyuse/contracts/result';
import { tryCatch } from '@dailyuse/contracts/result';
import type {
  ITaskInstanceApiClient,
  IIpcClient,
} from '../types';
import type {
  TaskInstanceClientDTO,
  CompleteTaskInstanceRequest,
  SkipTaskInstanceRequest,
} from '@dailyuse/contracts/task';

/**
 * TaskInstanceIpcAdapter
 *
 * IPC 实现的任务实例 API 客户端（用于 Electron 桌面应用）
 */
export class TaskInstanceIpcAdapter implements ITaskInstanceApiClient {
  constructor(private readonly ipcClient: IIpcClient) {}

  // ===== Task Instance CRUD =====

  async getTaskInstances(params?: {
    page?: number;
    limit?: number;
    templateId?: string;
    status?: string;
    startDate?: number;
    endDate?: number;
  }): Promise<Result<TaskInstanceClientDTO[]>> {
    return tryCatch(() => this.ipcClient.invoke('task:instance:list', params));
  }

  async getTaskInstanceById(id: string): Promise<Result<TaskInstanceClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke('task:instance:get', { id }));
  }

  async deleteTaskInstance(id: string): Promise<Result<void>> {
    return tryCatch(() => this.ipcClient.invoke('task:instance:delete', { id }));
  }

  // ===== Task Instance 状态管理 =====

  async startTaskInstance(id: string): Promise<Result<TaskInstanceClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke('task:instance:start', { id }));
  }

  async completeTaskInstance(
    id: string,
    request?: CompleteTaskInstanceRequest,
  ): Promise<Result<TaskInstanceClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke('task:instance:complete', { id, request }));
  }

  async skipTaskInstance(
    id: string,
    request?: SkipTaskInstanceRequest,
  ): Promise<Result<TaskInstanceClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke('task:instance:skip', { id, request }));
  }

  // ===== 批量操作 =====

  async checkExpiredInstances(): Promise<Result<{
    count: number;
    instances: TaskInstanceClientDTO[];
  }>> {
    return tryCatch(() => this.ipcClient.invoke('task:instance:check-expired'));
  }
}

/**
 * Factory function to create TaskInstanceIpcAdapter
 */
export function createTaskInstanceIpcAdapter(ipcClient: IIpcClient): TaskInstanceIpcAdapter {
  return new TaskInstanceIpcAdapter(ipcClient);
}
