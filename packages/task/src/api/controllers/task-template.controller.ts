/**
 * TaskTemplate Controller
 * 
 * Handles HTTP request logic for task template operations.
 * All methods call application services that return Result<T>.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { TaskTemplateServerDTO } from '@dailyuse/contracts/task';
import type { TaskTemplateApplicationService } from '../../application-server/services/task-template-application-service';
import type { 
  CreateTaskTemplateRequest,
  UpdateTaskTemplateRequest,
  TaskTemplateStatus 
} from '@dailyuse/contracts/task';

/**
 * TaskTemplate Controller
 */
export class TaskTemplateController {
  constructor(
    private readonly taskTemplateService: TaskTemplateApplicationService
  ) {}

  /**
   * Create new task template
   */
  async createTemplate(
    data: CreateTaskTemplateRequest,
    identityId: string
  ): Promise<Result<TaskTemplateServerDTO>> {
    return await this.taskTemplateService.createTaskTemplate({
      identityId,
      title: data.name,
      description: data.description,
      taskType: data.taskType,
      timeConfig: data.timeConfig,
      recurrenceRule: data.recurrenceRule,
      reminderConfig: data.reminderConfig,
      importance: data.importance,
      folderId: data.folderId,
      tags: data.tags,
      color: data.color,
    });
  }

  /**
   * Get template by ID
   */
  async getTemplate(
    id: string,
    includeChildren = false
  ): Promise<Result<TaskTemplateServerDTO | null>> {
    return await this.taskTemplateService.getTaskTemplate(id, includeChildren);
  }

  /**
   * List templates for account
   */
  async listTemplates(
    identityId: string,
    filters?: {
      status?: TaskTemplateStatus;
      folderId?: string;
      goalId?: string;
      tags?: string[];
    }
  ): Promise<Result<TaskTemplateServerDTO[]>> {
    if (filters?.status) {
      return await this.taskTemplateService.getTaskTemplatesByStatus(identityId, filters.status);
    } else if (filters?.folderId) {
      return await this.taskTemplateService.getTaskTemplatesByFolder(filters.folderId);
    } else if (filters?.goalId) {
      return await this.taskTemplateService.getTaskTemplatesByGoal(filters.goalId);
    } else if (filters?.tags) {
      return await this.taskTemplateService.getTaskTemplatesByTags(identityId, filters.tags);
    } else {
      return await this.taskTemplateService.getTaskTemplatesByAccount(identityId);
    }
  }

  /**
   * Update template
   */
  async updateTemplate(
    id: string,
    data: Partial<UpdateTaskTemplateRequest>
  ): Promise<Result<TaskTemplateServerDTO>> {
    return await this.taskTemplateService.updateTaskTemplate(id, {
      title: data.name,
      description: data.description,
      timeConfig: data.timeConfig,
      recurrenceRule: data.recurrenceRule,
      reminderConfig: data.reminderConfig,
      importance: data.importance,
      folderId: data.folderId,
      tags: data.tags,
      color: data.color,
    });
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<Result<void>> {
    return await this.taskTemplateService.deleteTaskTemplate(id);
  }

  /**
   * Activate template
   */
  async activateTemplate(id: string): Promise<Result<TaskTemplateServerDTO>> {
    return await this.taskTemplateService.activateTaskTemplate(id);
  }

  /**
   * Pause template
   */
  async pauseTemplate(id: string): Promise<Result<TaskTemplateServerDTO>> {
    return await this.taskTemplateService.pauseTaskTemplate(id);
  }

  /**
   * Archive template
   */
  async archiveTemplate(id: string): Promise<Result<TaskTemplateServerDTO>> {
    return await this.taskTemplateService.archiveTaskTemplate(id);
  }
}
