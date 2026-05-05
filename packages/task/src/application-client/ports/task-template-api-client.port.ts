/**
 * Task Template API Client Port
 *
 * Transport-agnostic interface for Task Template API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 */

import type { Result } from '@dailyuse/contracts/result';
import type {
  ListTaskTemplateFilters,
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  CreateTaskTemplateReq,
  UpdateTaskTemplateReq,
  GenerateInstancesReq,
  BindToGoalReq,
  QueryTaskTemplateGraphRes,
  TaskTemplateInstancesQuery,
} from '@dailyuse/contracts/task';

export interface TaskTemplateListParams extends Record<string, unknown>, ListTaskTemplateFilters {
  page?: number;
  limit?: number;
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
    query?: TaskTemplateInstancesQuery,
  ): Promise<Result<TaskInstanceClientDTO[]>>;
  bindToGoal(templateId: string, request: BindToGoalReq): Promise<Result<TaskTemplateClientDTO>>;
  unbindFromGoal(templateId: string): Promise<Result<TaskTemplateClientDTO>>;
}
