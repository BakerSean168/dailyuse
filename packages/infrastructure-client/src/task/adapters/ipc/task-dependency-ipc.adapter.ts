/**
 * Task Dependency IPC Adapter
 *
 * IPC implementation of ITaskDependencyApiClient for Electron desktop.
 */

import type { ITaskDependencyApiClient } from '../../ports/task-dependency-api-client.port';
import type {
  TaskDependencyClientDTO,
  CreateTaskDependencyRequest,
  UpdateTaskDependencyRequest,
  ValidateDependencyRequest,
  ValidateDependencyResponse,
  DependencyChainClientDTO,
} from '@dailyuse/contracts/task';
import type { IpcClient } from '../../../shared/ipc-client.types';

/**
 * TaskDependencyIpcAdapter
 *
 * IPC 实现的任务依赖关�?API 客户端（用于 Electron 桌面应用�?
 */
export class TaskDependencyIpcAdapter implements ITaskDependencyApiClient {
  constructor(private readonly ipcClient: IpcClient) {}

  async createDependency(
    taskUuid: string,
    request: CreateTaskDependencyRequest,
  ): Promise<TaskDependencyClientDTO> {
    return this.ipcClient.invoke('task-dependency:create', { taskUuid, request });
  }

  async getDependencies(taskUuid: string): Promise<TaskDependencyClientDTO[]> {
    return this.ipcClient.invoke('task-dependency:list', { taskUuid });
  }

  async getDependents(taskUuid: string): Promise<TaskDependencyClientDTO[]> {
    return this.ipcClient.invoke('task-dependency:dependents', { taskUuid });
  }

  async getDependencyChain(taskUuid: string): Promise<DependencyChainClientDTO> {
    return this.ipcClient.invoke('task-dependency:chain', { taskUuid });
  }

  async validateDependency(
    request: ValidateDependencyRequest,
  ): Promise<ValidateDependencyResponse> {
    return this.ipcClient.invoke('task-dependency:validate', request);
  }

  async deleteDependency(uuid: string): Promise<void> {
    await this.ipcClient.invoke('task-dependency:delete', { uuid });
  }

  async updateDependency(
    uuid: string,
    request: UpdateTaskDependencyRequest,
  ): Promise<TaskDependencyClientDTO> {
    return this.ipcClient.invoke('task-dependency:update', { uuid, request });
  }
}

/**
 * Factory function to create TaskDependencyIpcAdapter
 */
export function createTaskDependencyIpcAdapter(
  ipcClient: IpcClient,
): TaskDependencyIpcAdapter {
  return new TaskDependencyIpcAdapter(ipcClient);
}
