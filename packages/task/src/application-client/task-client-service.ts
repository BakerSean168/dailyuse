/**
 * Task Client Service
 *
 * Constructor-injected application service for task management.
 * Uses port interfaces directly, returning Result<T> types throughout.
 *
 * @module application-client/task-client-service
 */

import type { Result } from '@dailyuse/contracts/result';
import { map as mapResult } from '@dailyuse/contracts/result';
import type {
  CreateTaskTemplateReq,
  UpdateTaskTemplateReq,
  GenerateInstancesReq,
  BindToGoalReq,
  CompleteTaskInstanceReq,
  SkipTaskInstanceReq,
  CreateTaskDependencyBody,
  GetTaskInstancesByRangeReq,
  UpdateTaskDependencyBody,
  ValidateDependencyBody,
  ValidateDependencyResponse,
  TaskDependencyClientDTO,
  TaskGraphDependencyDTO,
  DependencyChainClientDTO,
  TaskInstanceClientDTO,
  TaskTemplateClientDTO,
  TaskTimeConfig,
  TaskTimeConfigDTO,
  RecurrenceRule,
  RecurrenceRuleDTO,
  TaskReminderConfig,
  TaskGoalBinding,
  TaskGoalBindingDTO,
} from '@dailyuse/contracts/task';
import type { TaskFolderId } from '@dailyuse/contracts/primitives';
import type { ITaskTemplateApiClient, TaskTemplateListParams } from './ports/task-template-api-client.port';
import type { ITaskInstanceApiClient } from './ports/task-instance-api-client.port';
import type { ITaskDependencyApiClient } from './ports/task-dependency-api-client.port';
import { TaskTemplate } from '../domain-client/aggregates/task-template';
import { TaskInstance } from '../domain-client/aggregates/task-instance';
import { TaskTemplateId } from '../server/domain/value-objects/task-template-id';
import { TaskInstanceId } from '../server/domain/value-objects/task-instance-id';
import { IdentityId } from '@dailyuse/domain-shared';

// ===== DTO-to-State Mappers =====

function taskTemplateFromDTO(dto: TaskTemplateClientDTO): TaskTemplate {
  return TaskTemplate.load({
    id: TaskTemplateId.of(dto.id),
    identityId: IdentityId.of(dto.identityId),
    name: dto.name,
    description: dto.description,
    timeConfig: parseTimeConfig(dto.timeConfig),
    recurrenceRule: dto.recurrenceRule ? parseRecurrenceRule(dto.recurrenceRule) : null,
    reminderConfig: dto.reminderConfig as TaskReminderConfig | null,
    importance: dto.importance,
    priority: dto.priority,
    goalBinding: dto.goalBinding ? parseGoalBinding(dto.goalBinding) : null,
    folderId: dto.folderId ? (dto.folderId as TaskFolderId) : null,
    tags: dto.tags ?? [],
    color: dto.color,
    status: dto.status,
    lastGeneratedDate: dto.lastGeneratedDate ? new Date(dto.lastGeneratedDate) : null,
    generateAheadDays: dto.generateAheadDays,
    version: dto.version,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    parentTaskId: dto.parentTaskId ? TaskTemplateId.of(dto.parentTaskId) : null,
    startDate: dto.startDate ? new Date(dto.startDate) : null,
    dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
    estimatedMinutes: dto.estimatedMinutes,
    actualMinutes: dto.actualMinutes,
    comment: dto.comment,
    dependencyStatus: dto.dependencyStatus,
    isBlocked: dto.isBlocked,
    blockingReason: dto.blockingReason,
    instanceCount: dto.instanceCount,
    completedInstanceCount: dto.completedInstanceCount,
    pendingInstanceCount: dto.pendingInstanceCount,
    completionRate: dto.completionRate,
    history: dto.history,
    instances: dto.instances,
  });
}

function taskInstanceFromDTO(dto: TaskInstanceClientDTO): TaskInstance {
  return TaskInstance.load({
    id: TaskInstanceId.of(dto.id),
    templateId: TaskTemplateId.of(dto.templateId),
    identityId: IdentityId.of(dto.identityId),
    instanceDate: new Date(dto.instanceDate),
    timeConfig: parseTimeConfig(dto.timeConfig),
    importance: dto.importance,
    priority: dto.priority,
    status: dto.status,
    actualStartTime: dto.actualStartTime ? new Date(dto.actualStartTime) : null,
    actualEndTime: dto.actualEndTime ? new Date(dto.actualEndTime) : null,
    comment: dto.comment,
    version: dto.version,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
  });
}

function parseTimeConfig(dto: TaskTimeConfigDTO): TaskTimeConfig {
  return {
    timeType: dto.timeType,
    startDate: dto.startDate ? new Date(dto.startDate) : null,
    timePoint: dto.timePoint,
    timeRange: dto.timeRange,
  };
}

function parseRecurrenceRule(dto: RecurrenceRuleDTO): RecurrenceRule {
  return {
    frequency: dto.frequency,
    interval: dto.interval,
    daysOfWeek: dto.daysOfWeek,
    endDate: dto.endDate ? new Date(dto.endDate) : null,
    occurrences: dto.occurrences,
  };
}

function parseGoalBinding(dto: TaskGoalBindingDTO): TaskGoalBinding {
  return {
    goalId: dto.goalId as unknown as TaskGoalBinding['goalId'],
    keyResultId: dto.keyResultId as unknown as TaskGoalBinding['keyResultId'],
    goalRecordValue: dto.goalRecordValue,
    progressTrigger: dto.progressTrigger,
  };
}

import type { TaskClientPort } from './task-client.port';

export class TaskClientService implements TaskClientPort {
  constructor(
    private readonly templateApi: ITaskTemplateApiClient,
    private readonly instanceApi: ITaskInstanceApiClient,
    private readonly dependencyApi: ITaskDependencyApiClient,
  ) {
    this.createTemplate = this.createTemplate.bind(this);
    this.listTemplates = this.listTemplates.bind(this);
    this.getTaskGraph = this.getTaskGraph.bind(this);
    this.getTemplate = this.getTemplate.bind(this);
    this.updateTemplate = this.updateTemplate.bind(this);
    this.deleteTemplate = this.deleteTemplate.bind(this);
    this.getTemplatesWithPrioritySorting = this.getTemplatesWithPrioritySorting.bind(this);
    this.activateTemplate = this.activateTemplate.bind(this);
    this.pauseTemplate = this.pauseTemplate.bind(this);
    this.archiveTemplate = this.archiveTemplate.bind(this);
    this.generateInstances = this.generateInstances.bind(this);
    this.getInstancesByDateRange = this.getInstancesByDateRange.bind(this);
    this.bindToGoal = this.bindToGoal.bind(this);
    this.unbindFromGoal = this.unbindFromGoal.bind(this);
    this.listInstances = this.listInstances.bind(this);
    this.getInstance = this.getInstance.bind(this);
    this.deleteInstance = this.deleteInstance.bind(this);
    this.startInstance = this.startInstance.bind(this);
    this.completeInstance = this.completeInstance.bind(this);
    this.skipInstance = this.skipInstance.bind(this);
    this.checkExpiredInstances = this.checkExpiredInstances.bind(this);
    this.createDependency = this.createDependency.bind(this);
    this.getDependencies = this.getDependencies.bind(this);
    this.getDependents = this.getDependents.bind(this);
    this.getDependencyChain = this.getDependencyChain.bind(this);
    this.validateDependency = this.validateDependency.bind(this);
    this.updateDependency = this.updateDependency.bind(this);
    this.deleteDependency = this.deleteDependency.bind(this);
  }

  // ===== Task Template Operations =====

  async createTemplate(request: CreateTaskTemplateReq): Promise<
    Result<{ template: TaskTemplate; instanceCount: number; todayInstanceCreated: boolean }>
  > {
    const result = await this.templateApi.createTaskTemplate(request);
    return mapResult(result, (data) => ({
      template: taskTemplateFromDTO(data.template),
      instanceCount: data.instanceCount,
      todayInstanceCreated: data.todayInstanceCreated,
    }));
  }

  async listTemplates(
    params?: TaskTemplateListParams,
  ): Promise<Result<{ templates: TaskTemplate[]; total: number }>> {
    const result = await this.templateApi.getTaskTemplates(params);
    return mapResult(result, (data) => {
      const templates = data.templates ?? [];
      const total = data.total ?? templates.length;
      return {
        templates: templates.map((dto) => taskTemplateFromDTO(dto)),
        total,
      };
    });
  }

  async getTaskGraph(params?: TaskTemplateListParams): Promise<
    Result<{ templates: TaskTemplate[]; dependencies: TaskGraphDependencyDTO[]; total: number }>
  > {
    const result = await this.templateApi.getTaskGraph(params);
    return mapResult(result, (data) => ({
      templates: (data.templates ?? []).map((dto) => taskTemplateFromDTO(dto)),
      dependencies: data.dependencies ?? [],
      total: data.total ?? data.templates.length,
    }));
  }

  async getTemplate(id: string): Promise<Result<TaskTemplate>> {
    const result = await this.templateApi.getTaskTemplateById(id);
    return mapResult(result, (dto) => taskTemplateFromDTO(dto));
  }

  async updateTemplate(id: string, request: UpdateTaskTemplateReq): Promise<Result<TaskTemplate>> {
    const result = await this.templateApi.updateTaskTemplate(id, request);
    return mapResult(result, (dto) => taskTemplateFromDTO(dto));
  }

  async deleteTemplate(id: string): Promise<Result<void>> {
    return this.templateApi.deleteTaskTemplate(id);
  }

  async getTemplatesWithPrioritySorting(params?: {
    limit?: number;
  }): Promise<Result<TaskTemplate[]>> {
    const result = await this.templateApi.getTasksWithPrioritySorting(params);
    return mapResult(result, (dtos) => dtos.map((dto) => taskTemplateFromDTO(dto)));
  }

  async activateTemplate(id: string): Promise<Result<TaskTemplate>> {
    const result = await this.templateApi.activateTaskTemplate(id);
    return mapResult(result, (dto) => taskTemplateFromDTO(dto));
  }

  async pauseTemplate(id: string): Promise<Result<TaskTemplate>> {
    const result = await this.templateApi.pauseTaskTemplate(id);
    return mapResult(result, (dto) => taskTemplateFromDTO(dto));
  }

  async archiveTemplate(id: string): Promise<Result<TaskTemplate>> {
    const result = await this.templateApi.archiveTaskTemplate(id);
    return mapResult(result, (dto) => taskTemplateFromDTO(dto));
  }

  async generateInstances(
    templateId: string,
    request: GenerateInstancesReq,
  ): Promise<Result<TaskInstance[]>> {
    const result = await this.templateApi.generateInstances(templateId, request);
    return mapResult(result, (dtos) => dtos.map((dto) => taskInstanceFromDTO(dto)));
  }

  async getInstancesByDateRange(
    templateId: string,
    from: number,
    to: number,
  ): Promise<Result<TaskInstance[]>> {
    const result = await this.templateApi.getInstancesByDateRange(templateId, { from, to });
    return mapResult(result, (dtos) => dtos.map((dto) => taskInstanceFromDTO(dto)));
  }

  async bindToGoal(templateId: string, request: BindToGoalReq): Promise<Result<TaskTemplate>> {
    const result = await this.templateApi.bindToGoal(templateId, request);
    return mapResult(result, (dto) => taskTemplateFromDTO(dto));
  }

  async unbindFromGoal(templateId: string): Promise<Result<TaskTemplate>> {
    const result = await this.templateApi.unbindFromGoal(templateId);
    return mapResult(result, (dto) => taskTemplateFromDTO(dto));
  }

  // ===== Task Instance Operations =====

  async listInstances(params?: {
    page?: number;
    limit?: number;
    templateId?: string;
    status?: string;
  }): Promise<Result<TaskInstance[]>> {
    const result = await this.instanceApi.getTaskInstances(params);
    return mapResult(result, (dtos) =>
      (Array.isArray(dtos) ? dtos : []).map((dto) => taskInstanceFromDTO(dto)),
    );
  }

  async listInstancesByDateRange(from: number, to: number): Promise<Result<TaskInstance[]>> {
    const request: GetTaskInstancesByRangeReq = {
      startDate: from,
      endDate: to,
    };
    const result = await this.instanceApi.getTaskInstancesByDateRange(request);
    return mapResult(result, (dtos) =>
      (Array.isArray(dtos) ? dtos : []).map((dto) => taskInstanceFromDTO(dto)),
    );
  }

  async getInstance(id: string): Promise<Result<TaskInstance>> {
    const result = await this.instanceApi.getTaskInstanceById(id);
    return mapResult(result, (dto) => taskInstanceFromDTO(dto));
  }

  async deleteInstance(id: string): Promise<Result<void>> {
    return this.instanceApi.deleteTaskInstance(id);
  }

  async startInstance(id: string): Promise<Result<TaskInstance>> {
    const result = await this.instanceApi.startTaskInstance(id);
    return mapResult(result, (dto) => taskInstanceFromDTO(dto));
  }

  async completeInstance(
    id: string,
    request?: CompleteTaskInstanceReq,
  ): Promise<Result<TaskInstance>> {
    const result = await this.instanceApi.completeTaskInstance(id, request);
    return mapResult(result, (dto) => taskInstanceFromDTO(dto));
  }

  async skipInstance(id: string, request?: SkipTaskInstanceReq): Promise<Result<TaskInstance>> {
    const result = await this.instanceApi.skipTaskInstance(id, request);
    return mapResult(result, (dto) => taskInstanceFromDTO(dto));
  }

  async checkExpiredInstances(): Promise<Result<{ count: number; instances: TaskInstance[] }>> {
    const result = await this.instanceApi.checkExpiredInstances();
    return mapResult(result, (data) => ({
      count: data.count,
      instances: data.instances.map((dto) => taskInstanceFromDTO(dto)),
    }));
  }

  // ===== Task Dependency Operations =====

  async createDependency(
    taskId: string,
    request: CreateTaskDependencyBody,
  ): Promise<Result<TaskDependencyClientDTO>> {
    return this.dependencyApi.createDependency(taskId, request);
  }

  async getDependencies(taskId: string): Promise<Result<TaskDependencyClientDTO[]>> {
    return this.dependencyApi.getDependencies(taskId);
  }

  async getDependents(taskId: string): Promise<Result<TaskDependencyClientDTO[]>> {
    return this.dependencyApi.getDependents(taskId);
  }

  async getDependencyChain(taskId: string): Promise<Result<DependencyChainClientDTO>> {
    return this.dependencyApi.getDependencyChain(taskId);
  }

  async validateDependency(
    request: ValidateDependencyBody,
  ): Promise<Result<ValidateDependencyResponse>> {
    return this.dependencyApi.validateDependency(request);
  }

  async updateDependency(
    id: string,
    request: UpdateTaskDependencyBody,
  ): Promise<Result<TaskDependencyClientDTO>> {
    return this.dependencyApi.updateDependency(id, request);
  }

  async deleteDependency(id: string): Promise<Result<void>> {
    return this.dependencyApi.deleteDependency(id);
  }
}

// ===== Factory =====

export function createTaskClientService(
  templateApi: ITaskTemplateApiClient,
  instanceApi: ITaskInstanceApiClient,
  dependencyApi: ITaskDependencyApiClient,
): TaskClientService {
  return new TaskClientService(templateApi, instanceApi, dependencyApi);
}
