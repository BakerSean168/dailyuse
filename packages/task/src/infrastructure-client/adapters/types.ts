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
  CreateTaskTemplateRequest,
  UpdateTaskTemplateRequest,
  GenerateInstancesRequest,
  BindToGoalRequest,
  CompleteTaskInstanceRequest,
  SkipTaskInstanceRequest,
  CreateTaskDependencyRequest,
  UpdateTaskDependencyRequest,
  ValidateDependencyRequest,
  ValidateDependencyResponse,
} from '@dailyuse/contracts/task';

// ============ Transport Client Interfaces ============
// Module only defines what it needs — concrete implementations injected from App layer.

// IResultHttpClient imported from @dailyuse/http-client

/**
 * IPC Client interface.
 * Satisfied by IpcClientImpl / ResultIpcClient at the App level.
 */
export interface IIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
}

// ============ Task Statistics DTO ============
// 合约包暂未定义，临时本地声明

export interface TaskStatisticsServerDTO {
  accountUuid: string;
  totalTemplates: number;
  totalInstances: number;
  completedToday: number;
  completedThisWeek: number;
  completionRate: number;
  efficiencyTrend: 'UP' | 'DOWN' | 'STABLE';
  updatedAt: string;
}

// ============ Task Template API Client ============

export interface ITaskTemplateApiClient {
  createTaskTemplate(request: CreateTaskTemplateRequest): Promise<Result<TaskTemplateClientDTO>>;
  getTaskTemplates(params?: {
    page?: number;
    limit?: number;
    status?: string;
    folderUuid?: string;
    goalUuid?: string;
    importance?: string;
    urgency?: string;
    tags?: string[];
  }): Promise<Result<{ templates: TaskTemplateClientDTO[]; total: number }>>;
  getTaskTemplateById(uuid: string, includeChildren?: boolean): Promise<Result<TaskTemplateClientDTO>>;
  updateTaskTemplate(uuid: string, request: UpdateTaskTemplateRequest): Promise<Result<TaskTemplateClientDTO>>;
  deleteTaskTemplate(uuid: string): Promise<Result<void>>;
  create(request: CreateTaskTemplateRequest): Promise<Result<TaskTemplateClientDTO>>;
  getByUuid(uuid: string): Promise<Result<TaskTemplateClientDTO>>;
  update(uuid: string, request: UpdateTaskTemplateRequest): Promise<Result<TaskTemplateClientDTO>>;
  getTasksWithPrioritySorting(params?: { limit?: number }): Promise<Result<TaskTemplateClientDTO[]>>;
  activateTaskTemplate(uuid: string): Promise<Result<TaskTemplateClientDTO>>;
  pauseTaskTemplate(uuid: string): Promise<Result<TaskTemplateClientDTO>>;
  archiveTaskTemplate(uuid: string): Promise<Result<TaskTemplateClientDTO>>;
  generateInstances(templateUuid: string, request: GenerateInstancesRequest): Promise<Result<TaskInstanceClientDTO[]>>;
  getInstancesByDateRange(templateUuid: string, from: number, to: number): Promise<Result<TaskInstanceClientDTO[]>>;
  bindToGoal(templateUuid: string, request: BindToGoalRequest): Promise<Result<TaskTemplateClientDTO>>;
  unbindFromGoal(templateUuid: string): Promise<Result<TaskTemplateClientDTO>>;
}

// ============ Task Instance API Client ============

export interface ITaskInstanceApiClient {
  getTaskInstances(params?: {
    page?: number;
    limit?: number;
    templateUuid?: string;
    status?: string;
    startDate?: number;
    endDate?: number;
  }): Promise<Result<TaskInstanceClientDTO[]>>;
  getTaskInstanceById(uuid: string): Promise<Result<TaskInstanceClientDTO>>;
  deleteTaskInstance(uuid: string): Promise<Result<void>>;
  startTaskInstance(uuid: string): Promise<Result<TaskInstanceClientDTO>>;
  completeTaskInstance(uuid: string, request?: CompleteTaskInstanceRequest): Promise<Result<TaskInstanceClientDTO>>;
  skipTaskInstance(uuid: string, request?: SkipTaskInstanceRequest): Promise<Result<TaskInstanceClientDTO>>;
  checkExpiredInstances(): Promise<Result<{ count: number; instances: TaskInstanceClientDTO[] }>>;
}

// ============ Task Dependency API Client ============

export interface ITaskDependencyApiClient {
  createDependency(taskUuid: string, request: CreateTaskDependencyRequest): Promise<Result<TaskDependencyClientDTO>>;
  getDependencies(taskUuid: string): Promise<Result<TaskDependencyClientDTO[]>>;
  getDependents(taskUuid: string): Promise<Result<TaskDependencyClientDTO[]>>;
  getDependencyChain(taskUuid: string): Promise<Result<DependencyChainClientDTO>>;
  validateDependency(request: ValidateDependencyRequest): Promise<Result<ValidateDependencyResponse>>;
  deleteDependency(uuid: string): Promise<Result<void>>;
  updateDependency(uuid: string, request: UpdateTaskDependencyRequest): Promise<Result<TaskDependencyClientDTO>>;
}

// ============ Task Statistics API Client ============

export interface ITaskStatisticsApiClient {
  getTaskStatistics(accountUuid: string, forceRecalculate?: boolean): Promise<Result<TaskStatisticsServerDTO>>;
  recalculateTaskStatistics(accountUuid: string, force?: boolean): Promise<Result<TaskStatisticsServerDTO>>;
  deleteTaskStatistics(accountUuid: string): Promise<Result<void>>;
  updateTemplateStats(accountUuid: string): Promise<Result<void>>;
  updateInstanceStats(accountUuid: string): Promise<Result<void>>;
  updateCompletionStats(accountUuid: string): Promise<Result<void>>;
  getTodayCompletionRate(accountUuid: string): Promise<Result<number>>;
  getWeekCompletionRate(accountUuid: string): Promise<Result<number>>;
  getEfficiencyTrend(accountUuid: string): Promise<Result<'UP' | 'DOWN' | 'STABLE'>>;
}
