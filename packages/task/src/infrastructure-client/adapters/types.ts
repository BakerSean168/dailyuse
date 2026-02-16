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
  identityId: string;
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
    folderId?: string;
    goalId?: string;
    importance?: string;
    urgency?: string;
    tags?: string[];
  }): Promise<Result<{ templates: TaskTemplateClientDTO[]; total: number }>>;
  getTaskTemplateById(id: string, includeChildren?: boolean): Promise<Result<TaskTemplateClientDTO>>;
  updateTaskTemplate(id: string, request: UpdateTaskTemplateRequest): Promise<Result<TaskTemplateClientDTO>>;
  deleteTaskTemplate(id: string): Promise<Result<void>>;
  create(request: CreateTaskTemplateRequest): Promise<Result<TaskTemplateClientDTO>>;
  getById(id: string): Promise<Result<TaskTemplateClientDTO>>;
  update(id: string, request: UpdateTaskTemplateRequest): Promise<Result<TaskTemplateClientDTO>>;
  getTasksWithPrioritySorting(params?: { limit?: number }): Promise<Result<TaskTemplateClientDTO[]>>;
  activateTaskTemplate(id: string): Promise<Result<TaskTemplateClientDTO>>;
  pauseTaskTemplate(id: string): Promise<Result<TaskTemplateClientDTO>>;
  archiveTaskTemplate(id: string): Promise<Result<TaskTemplateClientDTO>>;
  generateInstances(templateId: string, request: GenerateInstancesRequest): Promise<Result<TaskInstanceClientDTO[]>>;
  getInstancesByDateRange(templateId: string, from: number, to: number): Promise<Result<TaskInstanceClientDTO[]>>;
  bindToGoal(templateId: string, request: BindToGoalRequest): Promise<Result<TaskTemplateClientDTO>>;
  unbindFromGoal(templateId: string): Promise<Result<TaskTemplateClientDTO>>;
}

// ============ Task Instance API Client ============

export interface ITaskInstanceApiClient {
  getTaskInstances(params?: {
    page?: number;
    limit?: number;
    templateId?: string;
    status?: string;
    startDate?: number;
    endDate?: number;
  }): Promise<Result<TaskInstanceClientDTO[]>>;
  getTaskInstanceById(id: string): Promise<Result<TaskInstanceClientDTO>>;
  deleteTaskInstance(id: string): Promise<Result<void>>;
  startTaskInstance(id: string): Promise<Result<TaskInstanceClientDTO>>;
  completeTaskInstance(id: string, request?: CompleteTaskInstanceRequest): Promise<Result<TaskInstanceClientDTO>>;
  skipTaskInstance(id: string, request?: SkipTaskInstanceRequest): Promise<Result<TaskInstanceClientDTO>>;
  checkExpiredInstances(): Promise<Result<{ count: number; instances: TaskInstanceClientDTO[] }>>;
}

// ============ Task Dependency API Client ============

export interface ITaskDependencyApiClient {
  createDependency(taskId: string, request: CreateTaskDependencyRequest): Promise<Result<TaskDependencyClientDTO>>;
  getDependencies(taskId: string): Promise<Result<TaskDependencyClientDTO[]>>;
  getDependents(taskId: string): Promise<Result<TaskDependencyClientDTO[]>>;
  getDependencyChain(taskId: string): Promise<Result<DependencyChainClientDTO>>;
  validateDependency(request: ValidateDependencyRequest): Promise<Result<ValidateDependencyResponse>>;
  deleteDependency(id: string): Promise<Result<void>>;
  updateDependency(id: string, request: UpdateTaskDependencyRequest): Promise<Result<TaskDependencyClientDTO>>;
}

// ============ Task Statistics API Client ============

export interface ITaskStatisticsApiClient {
  getTaskStatistics(identityId: string, forceRecalculate?: boolean): Promise<Result<TaskStatisticsServerDTO>>;
  recalculateTaskStatistics(identityId: string, force?: boolean): Promise<Result<TaskStatisticsServerDTO>>;
  deleteTaskStatistics(identityId: string): Promise<Result<void>>;
  updateTemplateStats(identityId: string): Promise<Result<void>>;
  updateInstanceStats(identityId: string): Promise<Result<void>>;
  updateCompletionStats(identityId: string): Promise<Result<void>>;
  getTodayCompletionRate(identityId: string): Promise<Result<number>>;
  getWeekCompletionRate(identityId: string): Promise<Result<number>>;
  getEfficiencyTrend(identityId: string): Promise<Result<'UP' | 'DOWN' | 'STABLE'>>;
}
