/**
 * Task Dependency IPC Adapter
 *
 * IPC implementation of ITaskDependencyApiClient for Electron desktop.
 * Uses ResultIpcClient — all methods return Result<T> directly.
 */

import type { Result } from '@dailyuse/contracts/result';
import { TaskChannels } from '@dailyuse/contracts/electron';
import type { ITaskDependencyApiClient, IResultIpcClient } from '../types';
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
    return this.ipcClient.invoke(TaskChannels.DEPENDENCY_CREATE, { taskId, request });
  }

  async getDependencies(taskId: string): Promise<Result<TaskDependencyClientDTO[]>> {
    return this.ipcClient.invoke(TaskChannels.DEPENDENCY_LIST, { taskId });
  }

  async getDependents(taskId: string): Promise<Result<TaskDependencyClientDTO[]>> {
    return this.ipcClient.invoke(TaskChannels.DEPENDENCY_DEPENDENTS, { taskId });
  }

  async getDependencyChain(taskId: string): Promise<Result<DependencyChainClientDTO>> {
    return this.ipcClient.invoke(TaskChannels.DEPENDENCY_CHAIN, { taskId });
  }

  async validateDependency(
    request: ValidateDependencyRequest,
  ): Promise<Result<ValidateDependencyResponse>> {
    return this.ipcClient.invoke(TaskChannels.DEPENDENCY_VALIDATE, request);
  }

  async deleteDependency(id: string): Promise<Result<void>> {
    return this.ipcClient.invoke(TaskChannels.DEPENDENCY_DELETE, { id });
  }

  async updateDependency(
    id: string,
    request: UpdateTaskDependencyRequest,
  ): Promise<Result<TaskDependencyClientDTO>> {
    return this.ipcClient.invoke(TaskChannels.DEPENDENCY_UPDATE, { id, request });
  }
}

export function createTaskDependencyIpcAdapter(
  ipcClient: IResultIpcClient,
): TaskDependencyIpcAdapter {
  return new TaskDependencyIpcAdapter(ipcClient);
}
