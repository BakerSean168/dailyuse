import type { Result } from '@memoflow/contracts/result';
import type {
  CreateTaskTemplateReq,
  UpdateTaskTemplateReq,
  GenerateInstancesReq,
  BindToGoalReq,
  AbandonTaskPlanReq,
  CompleteTaskInstanceReq,
  MarkTaskInstanceMissedReq,
  SkipTaskInstanceReq,
  RescheduleTaskInput,
} from '@memoflow/contracts/task';
import type { TaskTemplateListParams } from './ports/task-template-api-client.port';
import type { TaskTemplate } from '../domain-client/aggregates/task-template';
import type { TaskInstance } from '../domain-client/aggregates/task-instance';

export interface TaskClientPort {
  // Task Template Operations
  createTemplate(
    request: CreateTaskTemplateReq,
  ): Promise<
    Result<{ template: TaskTemplate; instanceCount: number; todayInstanceCreated: boolean }>
  >;
  listTemplates(
    params?: TaskTemplateListParams,
  ): Promise<Result<{ templates: TaskTemplate[]; total: number }>>;
  getTemplate(id: string): Promise<Result<TaskTemplate>>;
  updateTemplate(id: string, request: UpdateTaskTemplateReq): Promise<Result<TaskTemplate>>;
  deleteTemplate(id: string): Promise<Result<void>>;
  activateTemplate(id: string): Promise<Result<TaskTemplate>>;
  pauseTemplate(id: string): Promise<Result<TaskTemplate>>;
  archiveTemplate(id: string): Promise<Result<TaskTemplate>>;
  abandonPlan(id: string, request?: AbandonTaskPlanReq): Promise<Result<TaskTemplate>>;
  generateInstances(
    templateId: string,
    request: GenerateInstancesReq,
  ): Promise<Result<TaskInstance[]>>;
  getInstancesByDateRange(
    templateId: string,
    from: number,
    to: number,
  ): Promise<Result<TaskInstance[]>>;
  bindToGoal(templateId: string, request: BindToGoalReq): Promise<Result<TaskTemplate>>;
  unbindFromGoal(templateId: string): Promise<Result<TaskTemplate>>;

  // Task Instance Operations
  listInstances(params?: {
    page?: number;
    limit?: number;
    templateId?: string;
    status?: string;
  }): Promise<Result<TaskInstance[]>>;
  listInstancesByDateRange(from: number, to: number): Promise<Result<TaskInstance[]>>;
  getInstance(id: string): Promise<Result<TaskInstance>>;
  deleteInstance(id: string): Promise<Result<void>>;
  startInstance(id: string): Promise<Result<TaskInstance>>;
  completeInstance(id: string, request?: CompleteTaskInstanceReq): Promise<Result<TaskInstance>>;
  uncompleteInstance(id: string): Promise<Result<TaskInstance>>;
  skipInstance(id: string, request?: SkipTaskInstanceReq): Promise<Result<TaskInstance>>;
  markInstanceMissed(
    id: string,
    request?: MarkTaskInstanceMissedReq,
  ): Promise<Result<TaskInstance>>;
  rescheduleInstance(id: string, request: RescheduleTaskInput): Promise<Result<TaskInstance>>;
}
