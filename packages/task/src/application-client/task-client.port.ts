import type { Result } from '@dailyuse/contracts/result';
import type {
  CreateTaskTemplateReq,
  UpdateTaskTemplateReq,
  GenerateInstancesReq,
  BindToGoalReq,
  CompleteTaskInstanceReq,
  SkipTaskInstanceReq,
  CreateTaskDependencyBody,
  UpdateTaskDependencyBody,
  ValidateDependencyBody,
  ValidateDependencyResponse,
  TaskDependencyClientDTO,
  TaskGraphDependencyDTO,
  DependencyChainClientDTO,
} from '@dailyuse/contracts/task';
import type { TaskTemplateListParams } from './ports/task-template-api-client.port';
import type { TaskTemplate } from '../domain-client/aggregates/task-template';
import type { TaskInstance } from '../domain-client/aggregates/task-instance';

export interface TaskClientPort {
  // Task Template Operations
  createTemplate(request: CreateTaskTemplateReq): Promise<
    Result<{ template: TaskTemplate; instanceCount: number; todayInstanceCreated: boolean }>
  >;
  listTemplates(params?: TaskTemplateListParams): Promise<Result<{ templates: TaskTemplate[]; total: number }>>;
  getTaskGraph(params?: TaskTemplateListParams): Promise<Result<{ templates: TaskTemplate[]; dependencies: TaskGraphDependencyDTO[]; total: number }>>;
  getTemplate(id: string): Promise<Result<TaskTemplate>>;
  updateTemplate(id: string, request: UpdateTaskTemplateReq): Promise<Result<TaskTemplate>>;
  deleteTemplate(id: string): Promise<Result<void>>;
  getTemplatesWithPrioritySorting(params?: { limit?: number }): Promise<Result<TaskTemplate[]>>;
  activateTemplate(id: string): Promise<Result<TaskTemplate>>;
  pauseTemplate(id: string): Promise<Result<TaskTemplate>>;
  archiveTemplate(id: string): Promise<Result<TaskTemplate>>;
  generateInstances(templateId: string, request: GenerateInstancesReq): Promise<Result<TaskInstance[]>>;
  getInstancesByDateRange(templateId: string, from: number, to: number): Promise<Result<TaskInstance[]>>;
  bindToGoal(templateId: string, request: BindToGoalReq): Promise<Result<TaskTemplate>>;
  unbindFromGoal(templateId: string): Promise<Result<TaskTemplate>>;

  // Task Instance Operations
  listInstances(params?: { page?: number; limit?: number; templateId?: string; status?: string }): Promise<Result<TaskInstance[]>>;
  listInstancesByDateRange(from: number, to: number): Promise<Result<TaskInstance[]>>;
  getInstance(id: string): Promise<Result<TaskInstance>>;
  deleteInstance(id: string): Promise<Result<void>>;
  startInstance(id: string): Promise<Result<TaskInstance>>;
  completeInstance(id: string, request?: CompleteTaskInstanceReq): Promise<Result<TaskInstance>>;
  skipInstance(id: string, request?: SkipTaskInstanceReq): Promise<Result<TaskInstance>>;
  checkExpiredInstances(): Promise<Result<{ count: number; instances: TaskInstance[] }>>;

  // Task Dependency Operations
  createDependency(taskId: string, request: CreateTaskDependencyBody): Promise<Result<TaskDependencyClientDTO>>;
  getDependencies(taskId: string): Promise<Result<TaskDependencyClientDTO[]>>;
  getDependents(taskId: string): Promise<Result<TaskDependencyClientDTO[]>>;
  getDependencyChain(taskId: string): Promise<Result<DependencyChainClientDTO>>;
  validateDependency(request: ValidateDependencyBody): Promise<Result<ValidateDependencyResponse>>;
  updateDependency(id: string, request: UpdateTaskDependencyBody): Promise<Result<TaskDependencyClientDTO>>;
  deleteDependency(id: string): Promise<Result<void>>;
}
