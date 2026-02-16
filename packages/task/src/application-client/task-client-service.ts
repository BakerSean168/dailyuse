/**
 * @deprecated Extract operations to individual service files following governance pattern.
 * Each API operation should have its own service file for better maintainability.
 * Example: create-task-template.ts, update-task-template.ts, delete-task-template.ts
 */

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
  TaskDependencyClientDTO,
  DependencyChainClientDTO,
  TaskInstanceClientDTO,
} from '@dailyuse/contracts/task';
import type {
  ITaskTemplateApiClient,
  ITaskInstanceApiClient,
  ITaskDependencyApiClient,
  ITaskStatisticsApiClient,
  TaskStatisticsServerDTO,
} from '@/infrastructure-client/adapters/types';
import { TaskTemplate } from '@/domain-client/aggregates/task-template';
import { TaskInstance } from '@/domain-client/aggregates/task-instance';

export class TaskClientService {
  constructor(
    private readonly templateApi: ITaskTemplateApiClient,
    private readonly instanceApi: ITaskInstanceApiClient,
    private readonly dependencyApi: ITaskDependencyApiClient,
    private readonly statisticsApi: ITaskStatisticsApiClient,
  ) {}

  // ===== Task Template Operations =====

  async createTemplate(request: CreateTaskTemplateRequest): Promise<Result<TaskTemplate>> {
    const result = await this.templateApi.createTaskTemplate(request);
    return mapResult(result, (dto) => TaskTemplate.fromDTO(dto));
  }

  async listTemplates(params?: {
    page?: number;
    limit?: number;
    status?: string;
    folderId?: string;
    goalId?: string;
    importance?: string;
    urgency?: string;
    tags?: string[];
  }): Promise<Result<{ templates: TaskTemplate[]; total: number }>> {
    const result = await this.templateApi.getTaskTemplates(params);
    return mapResult(result, (data) => ({
      templates: data.templates.map((dto) => TaskTemplate.fromDTO(dto)),
      total: data.total,
    }));
  }

  async getTemplate(id: string): Promise<Result<TaskTemplate>> {
    const result = await this.templateApi.getTaskTemplateById(id);
    return mapResult(result, (dto) => TaskTemplate.fromDTO(dto));
  }

  async updateTemplate(id: string, request: UpdateTaskTemplateRequest): Promise<Result<TaskTemplate>> {
    const result = await this.templateApi.updateTaskTemplate(id, request);
    return mapResult(result, (dto) => TaskTemplate.fromDTO(dto));
  }

  async deleteTemplate(id: string): Promise<Result<void>> {
    return this.templateApi.deleteTaskTemplate(id);
  }

  async getTemplatesWithPrioritySorting(params?: { limit?: number }): Promise<Result<TaskTemplate[]>> {
    const result = await this.templateApi.getTasksWithPrioritySorting(params);
    return mapResult(result, (dtos) => dtos.map((dto) => TaskTemplate.fromDTO(dto)));
  }

  async activateTemplate(id: string): Promise<Result<TaskTemplate>> {
    const result = await this.templateApi.activateTaskTemplate(id);
    return mapResult(result, (dto) => TaskTemplate.fromDTO(dto));
  }

  async pauseTemplate(id: string): Promise<Result<TaskTemplate>> {
    const result = await this.templateApi.pauseTaskTemplate(id);
    return mapResult(result, (dto) => TaskTemplate.fromDTO(dto));
  }

  async archiveTemplate(id: string): Promise<Result<TaskTemplate>> {
    const result = await this.templateApi.archiveTaskTemplate(id);
    return mapResult(result, (dto) => TaskTemplate.fromDTO(dto));
  }

  async generateInstances(templateId: string, request: GenerateInstancesRequest): Promise<Result<TaskInstance[]>> {
    const result = await this.templateApi.generateInstances(templateId, request);
    return mapResult(result, (dtos) => dtos.map((dto) => TaskInstance.fromDTO(dto)));
  }

  async getInstancesByDateRange(templateId: string, from: number, to: number): Promise<Result<TaskInstance[]>> {
    const result = await this.templateApi.getInstancesByDateRange(templateId, from, to);
    return mapResult(result, (dtos) => dtos.map((dto) => TaskInstance.fromDTO(dto)));
  }

  async bindToGoal(templateId: string, request: BindToGoalRequest): Promise<Result<TaskTemplate>> {
    const result = await this.templateApi.bindToGoal(templateId, request);
    return mapResult(result, (dto) => TaskTemplate.fromDTO(dto));
  }

  async unbindFromGoal(templateId: string): Promise<Result<TaskTemplate>> {
    const result = await this.templateApi.unbindFromGoal(templateId);
    return mapResult(result, (dto) => TaskTemplate.fromDTO(dto));
  }

  // ===== Task Instance Operations =====

  async listInstances(params?: {
    page?: number;
    limit?: number;
    templateId?: string;
    status?: string;
    startDate?: number;
    endDate?: number;
  }): Promise<Result<TaskInstance[]>> {
    const result = await this.instanceApi.getTaskInstances(params);
    return mapResult(result, (dtos) => dtos.map((dto) => TaskInstance.fromDTO(dto)));
  }

  async getInstance(id: string): Promise<Result<TaskInstance>> {
    const result = await this.instanceApi.getTaskInstanceById(id);
    return mapResult(result, (dto) => TaskInstance.fromDTO(dto));
  }

  async deleteInstance(id: string): Promise<Result<void>> {
    return this.instanceApi.deleteTaskInstance(id);
  }

  async startInstance(id: string): Promise<Result<TaskInstance>> {
    const result = await this.instanceApi.startTaskInstance(id);
    return mapResult(result, (dto) => TaskInstance.fromDTO(dto));
  }

  async completeInstance(id: string, request?: CompleteTaskInstanceRequest): Promise<Result<TaskInstance>> {
    const result = await this.instanceApi.completeTaskInstance(id, request);
    return mapResult(result, (dto) => TaskInstance.fromDTO(dto));
  }

  async skipInstance(id: string, request?: SkipTaskInstanceRequest): Promise<Result<TaskInstance>> {
    const result = await this.instanceApi.skipTaskInstance(id, request);
    return mapResult(result, (dto) => TaskInstance.fromDTO(dto));
  }

  async checkExpiredInstances(): Promise<Result<{ count: number; instances: TaskInstance[] }>> {
    const result = await this.instanceApi.checkExpiredInstances();
    return mapResult(result, (data) => ({
      count: data.count,
      instances: data.instances.map((dto) => TaskInstance.fromDTO(dto)),
    }));
  }

  // ===== Task Dependency Operations =====

  async createDependency(taskId: string, request: CreateTaskDependencyRequest): Promise<Result<TaskDependencyClientDTO>> {
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

  async validateDependency(request: ValidateDependencyRequest): Promise<Result<ValidateDependencyResponse>> {
    return this.dependencyApi.validateDependency(request);
  }

  async updateDependency(id: string, request: UpdateTaskDependencyRequest): Promise<Result<TaskDependencyClientDTO>> {
    return this.dependencyApi.updateDependency(id, request);
  }

  async deleteDependency(id: string): Promise<Result<void>> {
    return this.dependencyApi.deleteDependency(id);
  }

  // ===== Task Statistics Operations =====

  async getStatistics(identityId: string, forceRecalculate?: boolean): Promise<Result<TaskStatisticsServerDTO>> {
    return this.statisticsApi.getTaskStatistics(identityId, forceRecalculate);
  }

  async recalculateStatistics(identityId: string, force?: boolean): Promise<Result<TaskStatisticsServerDTO>> {
    return this.statisticsApi.recalculateTaskStatistics(identityId, force);
  }

  async deleteStatistics(identityId: string): Promise<Result<void>> {
    return this.statisticsApi.deleteTaskStatistics(identityId);
  }

  async updateTemplateStats(identityId: string): Promise<Result<void>> {
    return this.statisticsApi.updateTemplateStats(identityId);
  }

  async updateInstanceStats(identityId: string): Promise<Result<void>> {
    return this.statisticsApi.updateInstanceStats(identityId);
  }

  async updateCompletionStats(identityId: string): Promise<Result<void>> {
    return this.statisticsApi.updateCompletionStats(identityId);
  }

  async getTodayCompletionRate(identityId: string): Promise<Result<number>> {
    return this.statisticsApi.getTodayCompletionRate(identityId);
  }

  async getWeekCompletionRate(identityId: string): Promise<Result<number>> {
    return this.statisticsApi.getWeekCompletionRate(identityId);
  }

  async getEfficiencyTrend(identityId: string): Promise<Result<'UP' | 'DOWN' | 'STABLE'>> {
    return this.statisticsApi.getEfficiencyTrend(identityId);
  }
}
