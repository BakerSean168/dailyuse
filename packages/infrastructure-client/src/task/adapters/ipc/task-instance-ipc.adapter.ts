/**
 * Task Instance IPC Adapter
 *
 * IPC implementation of ITaskInstanceApiClient for Electron desktop.
 */

import type { ITaskInstanceApiClient } from '../../ports/task-instance-api-client.port';
import type {
  TaskInstanceClientDTO,
  CompleteTaskInstanceRequest,
  SkipTaskInstanceRequest,
} from '@dailyuse/contracts/task';
import type { IpcClient } from '../../../shared/ipc-client.types';

/**
 * TaskInstanceIpcAdapter
 *
 * IPC 实现的任务实�?API 客户端（用于 Electron 桌面应用�?
 */
export class TaskInstanceIpcAdapter implements ITaskInstanceApiClient {
  constructor(private readonly ipcClient: IpcClient) {}

  // ===== Task Instance CRUD =====

  async getTaskInstances(params?: {
    page?: number;
    limit?: number;
    templateUuid?: string;
    status?: string;
    startDate?: number;
    endDate?: number;
  }): Promise<TaskInstanceClientDTO[]> {
    return this.ipcClient.invoke('task-instance:list', params);
  }

  async getTaskInstanceById(uuid: string): Promise<TaskInstanceClientDTO> {
    return this.ipcClient.invoke('task-instance:get', { uuid });
  }

  async deleteTaskInstance(uuid: string): Promise<void> {
    await this.ipcClient.invoke('task-instance:delete', { uuid });
  }

  // ===== Task Instance 状态管�?=====

  async startTaskInstance(uuid: string): Promise<TaskInstanceClientDTO> {
    return this.ipcClient.invoke('task-instance:start', { uuid });
  }

  async completeTaskInstance(
    uuid: string,
    request?: CompleteTaskInstanceRequest,
  ): Promise<TaskInstanceClientDTO> {
    return this.ipcClient.invoke('task-instance:complete', { uuid, request });
  }

  async skipTaskInstance(
    uuid: string,
    request?: SkipTaskInstanceRequest,
  ): Promise<TaskInstanceClientDTO> {
    return this.ipcClient.invoke('task-instance:skip', { uuid, request });
  }

  // ===== 批量操作 =====

  async checkExpiredInstances(): Promise<{
    count: number;
    instances: TaskInstanceClientDTO[];
  }> {
    return this.ipcClient.invoke('task-instance:check-expired');
  }
}

/**
 * Factory function to create TaskInstanceIpcAdapter
 */
export function createTaskInstanceIpcAdapter(ipcClient: IpcClient): TaskInstanceIpcAdapter {
  return new TaskInstanceIpcAdapter(ipcClient);
}
