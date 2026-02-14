/**
 * Task Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for Task API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @dailyuse/contracts/task.
 */

import type { IHttpClient } from '@dailyuse/http-client';
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

// IHttpClient imported from @dailyuse/http-client

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
  createTaskTemplate(request: CreateTaskTemplateRequest): Promise<TaskTemplateClientDTO>;
  getTaskTemplates(params?: {
    page?: number;
    limit?: number;
    status?: string;
    folderUuid?: string;
    goalUuid?: string;
    importance?: string;
    urgency?: string;
    tags?: string[];
  }): Promise<{ templates: TaskTemplateClientDTO[]; total: number }>;
  getTaskTemplateById(uuid: string, includeChildren?: boolean): Promise<TaskTemplateClientDTO>;
  updateTaskTemplate(uuid: string, request: UpdateTaskTemplateRequest): Promise<TaskTemplateClientDTO>;
  deleteTaskTemplate(uuid: string): Promise<void>;
  create(request: CreateTaskTemplateRequest): Promise<TaskTemplateClientDTO>;
  getByUuid(uuid: string): Promise<TaskTemplateClientDTO>;
  update(uuid: string, request: UpdateTaskTemplateRequest): Promise<TaskTemplateClientDTO>;
  getTasksWithPrioritySorting(params?: { limit?: number }): Promise<TaskTemplateClientDTO[]>;
  activateTaskTemplate(uuid: string): Promise<TaskTemplateClientDTO>;
  pauseTaskTemplate(uuid: string): Promise<TaskTemplateClientDTO>;
  archiveTaskTemplate(uuid: string): Promise<TaskTemplateClientDTO>;
  generateInstances(templateUuid: string, request: GenerateInstancesRequest): Promise<TaskInstanceClientDTO[]>;
  getInstancesByDateRange(templateUuid: string, from: number, to: number): Promise<TaskInstanceClientDTO[]>;
  bindToGoal(templateUuid: string, request: BindToGoalRequest): Promise<TaskTemplateClientDTO>;
  unbindFromGoal(templateUuid: string): Promise<TaskTemplateClientDTO>;
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
  }): Promise<TaskInstanceClientDTO[]>;
  getTaskInstanceById(uuid: string): Promise<TaskInstanceClientDTO>;
  deleteTaskInstance(uuid: string): Promise<void>;
  startTaskInstance(uuid: string): Promise<TaskInstanceClientDTO>;
  completeTaskInstance(uuid: string, request?: CompleteTaskInstanceRequest): Promise<TaskInstanceClientDTO>;
  skipTaskInstance(uuid: string, request?: SkipTaskInstanceRequest): Promise<TaskInstanceClientDTO>;
  checkExpiredInstances(): Promise<{ count: number; instances: TaskInstanceClientDTO[] }>;
}

// ============ Task Dependency API Client ============

export interface ITaskDependencyApiClient {
  createDependency(taskUuid: string, request: CreateTaskDependencyRequest): Promise<TaskDependencyClientDTO>;
  getDependencies(taskUuid: string): Promise<TaskDependencyClientDTO[]>;
  getDependents(taskUuid: string): Promise<TaskDependencyClientDTO[]>;
  getDependencyChain(taskUuid: string): Promise<DependencyChainClientDTO>;
  validateDependency(request: ValidateDependencyRequest): Promise<ValidateDependencyResponse>;
  deleteDependency(uuid: string): Promise<void>;
  updateDependency(uuid: string, request: UpdateTaskDependencyRequest): Promise<TaskDependencyClientDTO>;
}

// ============ Task Statistics API Client ============

export interface ITaskStatisticsApiClient {
  getTaskStatistics(accountUuid: string, forceRecalculate?: boolean): Promise<TaskStatisticsServerDTO>;
  recalculateTaskStatistics(accountUuid: string, force?: boolean): Promise<TaskStatisticsServerDTO>;
  deleteTaskStatistics(accountUuid: string): Promise<void>;
  updateTemplateStats(accountUuid: string): Promise<void>;
  updateInstanceStats(accountUuid: string): Promise<void>;
  updateCompletionStats(accountUuid: string): Promise<void>;
  getTodayCompletionRate(accountUuid: string): Promise<number>;
  getWeekCompletionRate(accountUuid: string): Promise<number>;
  getEfficiencyTrend(accountUuid: string): Promise<'UP' | 'DOWN' | 'STABLE'>;
}
