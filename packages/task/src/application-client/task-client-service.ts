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
    folderUuid?: string;
    goalUuid?: string;
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

  async getTemplate(uuid: string): Promise<Result<TaskTemplate>> {
    const result = await this.templateApi.getTaskTemplateById(uuid);
    return mapResult(result, (dto) => TaskTemplate.fromDTO(dto));
  }

  async updateTemplate(uuid: string, request: UpdateTaskTemplateRequest): Promise<Result<TaskTemplate>> {
    const result = await this.templateApi.updateTaskTemplate(uuid, request);
    return mapResult(result, (dto) => TaskTemplate.fromDTO(dto));
  }

  async deleteTemplate(uuid: string): Promise<Result<void>> {
    return this.templateApi.deleteTaskTemplate(uuid);
  }

  async getTemplatesWithPrioritySorting(params?: { limit?: number }): Promise<Result<TaskTemplate[]>> {
    const result = await this.templateApi.getTasksWithPrioritySorting(params);
    return mapResult(result, (dtos) => dtos.map((dto) => TaskTemplate.fromDTO(dto)));
  }

  async activateTemplate(uuid: string): Promise<Result<TaskTemplate>> {
    const result = await this.templateApi.activateTaskTemplate(uuid);
    return mapResult(result, (dto) => TaskTemplate.fromDTO(dto));
  }

  async pauseTemplate(uuid: string): Promise<Result<TaskTemplate>> {
    const result = await this.templateApi.pauseTaskTemplate(uuid);
    return mapResult(result, (dto) => TaskTemplate.fromDTO(dto));
  }

  async archiveTemplate(uuid: string): Promise<Result<TaskTemplate>> {
    const result = await this.templateApi.archiveTaskTemplate(uuid);
    return mapResult(result, (dto) => TaskTemplate.fromDTO(dto));
  }

  async generateInstances(templateUuid: string, request: GenerateInstancesRequest): Promise<Result<TaskInstance[]>> {
    const result = await this.templateApi.generateInstances(templateUuid, request);
    return mapResult(result, (dtos) => dtos.map((dto) => TaskInstance.fromDTO(dto)));
  }

  async getInstancesByDateRange(templateUuid: string, from: number, to: number): Promise<Result<TaskInstance[]>> {
    const result = await this.templateApi.getInstancesByDateRange(templateUuid, from, to);
    return mapResult(result, (dtos) => dtos.map((dto) => TaskInstance.fromDTO(dto)));
  }

  async bindToGoal(templateUuid: string, request: BindToGoalRequest): Promise<Result<TaskTemplate>> {
    const result = await this.templateApi.bindToGoal(templateUuid, request);
    return mapResult(result, (dto) => TaskTemplate.fromDTO(dto));
  }

  async unbindFromGoal(templateUuid: string): Promise<Result<TaskTemplate>> {
    const result = await this.templateApi.unbindFromGoal(templateUuid);
    return mapResult(result, (dto) => TaskTemplate.fromDTO(dto));
  }

  // ===== Task Instance Operations =====

  async listInstances(params?: {
    page?: number;
    limit?: number;
    templateUuid?: string;
    status?: string;
    startDate?: number;
    endDate?: number;
  }): Promise<Result<TaskInstance[]>> {
    const result = await this.instanceApi.getTaskInstances(params);
    return mapResult(result, (dtos) => dtos.map((dto) => TaskInstance.fromDTO(dto)));
  }

  async getInstance(uuid: string): Promise<Result<TaskInstance>> {
    const result = await this.instanceApi.getTaskInstanceById(uuid);
    return mapResult(result, (dto) => TaskInstance.fromDTO(dto));
  }

  async deleteInstance(uuid: string): Promise<Result<void>> {
    return this.instanceApi.deleteTaskInstance(uuid);
  }

  async startInstance(uuid: string): Promise<Result<TaskInstance>> {
    const result = await this.instanceApi.startTaskInstance(uuid);
    return mapResult(result, (dto) => TaskInstance.fromDTO(dto));
  }

  async completeInstance(uuid: string, request?: CompleteTaskInstanceRequest): Promise<Result<TaskInstance>> {
    const result = await this.instanceApi.completeTaskInstance(uuid, request);
    return mapResult(result, (dto) => TaskInstance.fromDTO(dto));
  }

  async skipInstance(uuid: string, request?: SkipTaskInstanceRequest): Promise<Result<TaskInstance>> {
    const result = await this.instanceApi.skipTaskInstance(uuid, request);
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

  async createDependency(taskUuid: string, request: CreateTaskDependencyRequest): Promise<Result<TaskDependencyClientDTO>> {
    return this.dependencyApi.createDependency(taskUuid, request);
  }

  async getDependencies(taskUuid: string): Promise<Result<TaskDependencyClientDTO[]>> {
    return this.dependencyApi.getDependencies(taskUuid);
  }

  async getDependents(taskUuid: string): Promise<Result<TaskDependencyClientDTO[]>> {
    return this.dependencyApi.getDependents(taskUuid);
  }

  async getDependencyChain(taskUuid: string): Promise<Result<DependencyChainClientDTO>> {
    return this.dependencyApi.getDependencyChain(taskUuid);
  }

  async validateDependency(request: ValidateDependencyRequest): Promise<Result<ValidateDependencyResponse>> {
    return this.dependencyApi.validateDependency(request);
  }

  async updateDependency(uuid: string, request: UpdateTaskDependencyRequest): Promise<Result<TaskDependencyClientDTO>> {
    return this.dependencyApi.updateDependency(uuid, request);
  }

  async deleteDependency(uuid: string): Promise<Result<void>> {
    return this.dependencyApi.deleteDependency(uuid);
  }

  // ===== Task Statistics Operations =====

  async getStatistics(accountUuid: string, forceRecalculate?: boolean): Promise<Result<TaskStatisticsServerDTO>> {
    return this.statisticsApi.getTaskStatistics(accountUuid, forceRecalculate);
  }

  async recalculateStatistics(accountUuid: string, force?: boolean): Promise<Result<TaskStatisticsServerDTO>> {
    return this.statisticsApi.recalculateTaskStatistics(accountUuid, force);
  }

  async deleteStatistics(accountUuid: string): Promise<Result<void>> {
    return this.statisticsApi.deleteTaskStatistics(accountUuid);
  }

  async updateTemplateStats(accountUuid: string): Promise<Result<void>> {
    return this.statisticsApi.updateTemplateStats(accountUuid);
  }

  async updateInstanceStats(accountUuid: string): Promise<Result<void>> {
    return this.statisticsApi.updateInstanceStats(accountUuid);
  }

  async updateCompletionStats(accountUuid: string): Promise<Result<void>> {
    return this.statisticsApi.updateCompletionStats(accountUuid);
  }

  async getTodayCompletionRate(accountUuid: string): Promise<Result<number>> {
    return this.statisticsApi.getTodayCompletionRate(accountUuid);
  }

  async getWeekCompletionRate(accountUuid: string): Promise<Result<number>> {
    return this.statisticsApi.getWeekCompletionRate(accountUuid);
  }

  async getEfficiencyTrend(accountUuid: string): Promise<Result<'UP' | 'DOWN' | 'STABLE'>> {
    return this.statisticsApi.getEfficiencyTrend(accountUuid);
  }
}
