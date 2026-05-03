/**
 * Task Dependency API Client Port
 *
 * Transport-agnostic interface for Task Dependency API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 */

import type { Result } from '@dailyuse/contracts/result';
import type {
  TaskDependencyClientDTO,
  DependencyChainClientDTO,
  CreateTaskDependencyRequest,
  UpdateTaskDependencyRequest,
  ValidateDependencyRequest,
  ValidateDependencyResponse,
} from '@dailyuse/contracts/task';

export interface ITaskDependencyApiClient {
  createDependency(
    taskId: string,
    request: CreateTaskDependencyRequest,
  ): Promise<Result<TaskDependencyClientDTO>>;
  getDependencies(taskId: string): Promise<Result<TaskDependencyClientDTO[]>>;
  getDependents(taskId: string): Promise<Result<TaskDependencyClientDTO[]>>;
  getDependencyChain(taskId: string): Promise<Result<DependencyChainClientDTO>>;
  validateDependency(
    request: ValidateDependencyRequest,
  ): Promise<Result<ValidateDependencyResponse>>;
  deleteDependency(id: string): Promise<Result<void>>;
  updateDependency(
    id: string,
    request: UpdateTaskDependencyRequest,
  ): Promise<Result<TaskDependencyClientDTO>>;
}
