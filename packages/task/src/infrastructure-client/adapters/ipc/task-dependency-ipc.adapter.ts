/**
 * Task Dependency IPC Adapter
 *
 * IPC implementation of ITaskDependencyApiClient for Electron desktop.
 * Uses ResultIpcClient — all methods return Result<T> directly.
 */

import type { Result } from '@dailyuse/contracts/result';
import type {
  ITaskDependencyApiClient,
  IResultIpcClient,
} from '../types';
import type {
  TaskDependencyClientDTO,
  CreateTaskDependencyRequest,
  UpdateTaskDependencyRequest,
  ValidateDependencyRequest,
  ValidateDependencyResponse,
  DependencyChainClientDTO,
} from '@dailyuse/contracts/task';

export class TaskDependencyIpcAdapter implements ITaskDependencyApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async createDependency(
    taskId: string,
    request: CreateTaskDependencyRequest,
  ): Promise<Result<TaskDependencyClientDTO>> {
    return this.ipcClient.invoke('task:dependency:create', { taskId, request });
  }

  async getDependencies(taskId: string): Promise<Result<TaskDependencyClientDTO[]>> {
    return this.ipcClient.invoke('task:dependency:list', { taskId });
  }

  async getDependents(taskId: string): Promise<Result<TaskDependencyClientDTO[]>> {
    return this.ipcClient.invoke('task:dependency:dependents', { taskId });
  }

  async getDependencyChain(taskId: string): Promise<Result<DependencyChainClientDTO>> {
    return this.ipcClient.invoke('task:dependency:chain', { taskId });
  }

  async validateDependency(
    request: ValidateDependencyRequest,
  ): Promise<Result<ValidateDependencyResponse>> {
    return this.ipcClient.invoke('task:dependency:validate', request);
  }

  async deleteDependency(id: string): Promise<Result<void>> {
    return this.ipcClient.invoke('task:dependency:delete', { id });
  }

  async updateDependency(
    id: string,
    request: UpdateTaskDependencyRequest,
  ): Promise<Result<TaskDependencyClientDTO>> {
    return this.ipcClient.invoke('task:dependency:update', { id, request });
  }
}

export function createTaskDependencyIpcAdapter(
  ipcClient: IResultIpcClient,
): TaskDependencyIpcAdapter {
  return new TaskDependencyIpcAdapter(ipcClient);
}
