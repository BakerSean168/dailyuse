/**
 * Task Dependency IPC Adapter
 *
 * IPC implementation of ITaskDependencyApiClient for Electron desktop.
 */

import type { Result } from '@dailyuse/contracts/result';
import { tryCatch } from '@dailyuse/contracts/result';
import type {
  ITaskDependencyApiClient,
  IIpcClient,
} from '../types';
import type {
  TaskDependencyClientDTO,
  CreateTaskDependencyRequest,
  UpdateTaskDependencyRequest,
  ValidateDependencyRequest,
  ValidateDependencyResponse,
  DependencyChainClientDTO,
} from '@dailyuse/contracts/task';

/**
 * TaskDependencyIpcAdapter
 *
 * IPC 实现的任务依赖关系 API 客户端（用于 Electron 桌面应用）
 */
export class TaskDependencyIpcAdapter implements ITaskDependencyApiClient {
  constructor(private readonly ipcClient: IIpcClient) {}

  async createDependency(
    taskId: string,
    request: CreateTaskDependencyRequest,
  ): Promise<Result<TaskDependencyClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke('task:dependency:create', { taskId, request }));
  }

  async getDependencies(taskId: string): Promise<Result<TaskDependencyClientDTO[]>> {
    return tryCatch(() => this.ipcClient.invoke('task:dependency:list', { taskId }));
  }

  async getDependents(taskId: string): Promise<Result<TaskDependencyClientDTO[]>> {
    return tryCatch(() => this.ipcClient.invoke('task:dependency:dependents', { taskId }));
  }

  async getDependencyChain(taskId: string): Promise<Result<DependencyChainClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke('task:dependency:chain', { taskId }));
  }

  async validateDependency(
    request: ValidateDependencyRequest,
  ): Promise<Result<ValidateDependencyResponse>> {
    return tryCatch(() => this.ipcClient.invoke('task:dependency:validate', request));
  }

  async deleteDependency(id: string): Promise<Result<void>> {
    return tryCatch(() => this.ipcClient.invoke('task:dependency:delete', { id }));
  }

  async updateDependency(
    id: string,
    request: UpdateTaskDependencyRequest,
  ): Promise<Result<TaskDependencyClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke('task:dependency:update', { id, request }));
  }
}

/**
 * Factory function to create TaskDependencyIpcAdapter
 */
export function createTaskDependencyIpcAdapter(
  ipcClient: IIpcClient,
): TaskDependencyIpcAdapter {
  return new TaskDependencyIpcAdapter(ipcClient);
}
