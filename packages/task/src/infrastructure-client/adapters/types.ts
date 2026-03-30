/**
 * Task Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for Task API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @dailyuse/contracts/task.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';
import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  TaskDependencyClientDTO,
  DependencyChainClientDTO,
  CreateTaskTemplateReq,
  UpdateTaskTemplateReq,
  GenerateInstancesReq,
  BindToGoalReq,
  CompleteTaskInstanceReq,
  SkipTaskInstanceReq,
  CreateTaskDependencyRequest,
  UpdateTaskDependencyRequest,
  ValidateDependencyRequest,
  ValidateDependencyResponse,
  QueryTaskTemplateGraphRes,
} from '@dailyuse/contracts/task';

// ============ Transport Client Interfaces ============
// Module only defines what it needs - concrete implementations injected from App layer.

// IResultHttpClient imported from @dailyuse/http-client

/**
 * IPC Client interface (Result-returning).
 * Satisfied by ResultIpcClient from @dailyuse/ipc-client at the App level.
 */
export interface IResultIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<Result<T>>;
}

// ============ Task Template API Client ============

export interface TaskTemplateListParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
  status?: string;
  goalId?: string;
  tags?: string[];
}

export interface ITaskTemplateApiClient {
  createTaskTemplate(request: CreateTaskTemplateReq): Promise<Result<TaskTemplateClientDTO>>;
  getTaskTemplates(
    params?: TaskTemplateListParams,
  ): Promise<Result<{ templates: TaskTemplateClientDTO[]; total: number }>>;
  getTaskGraph(params?: TaskTemplateListParams): Promise<Result<QueryTaskTemplateGraphRes>>;
  getTaskTemplateById(
    id: string,
    includeChildren?: boolean,
  ): Promise<Result<TaskTemplateClientDTO>>;
  updateTaskTemplate(
    id: string,
    request: UpdateTaskTemplateReq,
  ): Promise<Result<TaskTemplateClientDTO>>;
  deleteTaskTemplate(id: string): Promise<Result<void>>;
  getTasksWithPrioritySorting(params?: {
    limit?: number;
  }): Promise<Result<TaskTemplateClientDTO[]>>;
  activateTaskTemplate(id: string): Promise<Result<TaskTemplateClientDTO>>;
  pauseTaskTemplate(id: string): Promise<Result<TaskTemplateClientDTO>>;
  archiveTaskTemplate(id: string): Promise<Result<TaskTemplateClientDTO>>;
  generateInstances(
    templateId: string,
    request: GenerateInstancesReq,
  ): Promise<Result<TaskInstanceClientDTO[]>>;
  getInstancesByDateRange(
    templateId: string,
    from: number,
    to: number,
  ): Promise<Result<TaskInstanceClientDTO[]>>;
  bindToGoal(templateId: string, request: BindToGoalReq): Promise<Result<TaskTemplateClientDTO>>;
  unbindFromGoal(templateId: string): Promise<Result<TaskTemplateClientDTO>>;
}

// ============ Task Instance API Client ============

export interface ITaskInstanceApiClient {
  getTaskInstances(params?: {
    page?: number;
    limit?: number;
    templateId?: string;
    status?: string;
  }): Promise<Result<TaskInstanceClientDTO[]>>;
  getTaskInstancesByDateRange(
    startDate: number,
    endDate: number,
  ): Promise<Result<TaskInstanceClientDTO[]>>;
  getTaskInstanceById(id: string): Promise<Result<TaskInstanceClientDTO>>;
  deleteTaskInstance(id: string): Promise<Result<void>>;
  startTaskInstance(id: string): Promise<Result<TaskInstanceClientDTO>>;
  completeTaskInstance(
    id: string,
    request?: CompleteTaskInstanceReq,
  ): Promise<Result<TaskInstanceClientDTO>>;
  skipTaskInstance(
    id: string,
    request?: SkipTaskInstanceReq,
  ): Promise<Result<TaskInstanceClientDTO>>;
  checkExpiredInstances(): Promise<Result<{ count: number; instances: TaskInstanceClientDTO[] }>>;
}

// ============ Task Dependency API Client ============

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
