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
    accountUuid: string
  ): Promise<Result<TaskTemplateServerDTO>> {
    return await this.taskTemplateService.createTaskTemplate({
      accountUuid,
      title: data.name,
      description: data.description,
      taskType: data.taskType,
      timeConfig: data.timeConfig,
      recurrenceRule: data.recurrenceRule,
      reminderConfig: data.reminderConfig,
      importance: data.importance,
      folderUuid: data.folderUuid,
      tags: data.tags,
      color: data.color,
    });
  }

  /**
   * Get template by ID
   */
  async getTemplate(
    uuid: string,
    includeChildren = false
  ): Promise<Result<TaskTemplateServerDTO | null>> {
    return await this.taskTemplateService.getTaskTemplate(uuid, includeChildren);
  }

  /**
   * List templates for account
   */
  async listTemplates(
    accountUuid: string,
    filters?: {
      status?: TaskTemplateStatus;
      folderUuid?: string;
      goalUuid?: string;
      tags?: string[];
    }
  ): Promise<Result<TaskTemplateServerDTO[]>> {
    if (filters?.status) {
      return await this.taskTemplateService.getTaskTemplatesByStatus(accountUuid, filters.status);
    } else if (filters?.folderUuid) {
      return await this.taskTemplateService.getTaskTemplatesByFolder(filters.folderUuid);
    } else if (filters?.goalUuid) {
      return await this.taskTemplateService.getTaskTemplatesByGoal(filters.goalUuid);
    } else if (filters?.tags) {
      return await this.taskTemplateService.getTaskTemplatesByTags(accountUuid, filters.tags);
    } else {
      return await this.taskTemplateService.getTaskTemplatesByAccount(accountUuid);
    }
  }

  /**
   * Update template
   */
  async updateTemplate(
    uuid: string,
    data: Partial<UpdateTaskTemplateRequest>
  ): Promise<Result<TaskTemplateServerDTO>> {
    return await this.taskTemplateService.updateTaskTemplate(uuid, {
      title: data.name,
      description: data.description,
      timeConfig: data.timeConfig,
      recurrenceRule: data.recurrenceRule,
      reminderConfig: data.reminderConfig,
      importance: data.importance,
      folderUuid: data.folderUuid,
      tags: data.tags,
      color: data.color,
    });
  }

  /**
   * Delete template
   */
  async deleteTemplate(uuid: string): Promise<Result<void>> {
    return await this.taskTemplateService.deleteTaskTemplate(uuid);
  }

  /**
   * Activate template
   */
  async activateTemplate(uuid: string): Promise<Result<TaskTemplateServerDTO>> {
    return await this.taskTemplateService.activateTaskTemplate(uuid);
  }

  /**
   * Pause template
   */
  async pauseTemplate(uuid: string): Promise<Result<TaskTemplateServerDTO>> {
    return await this.taskTemplateService.pauseTaskTemplate(uuid);
  }

  /**
   * Archive template
   */
  async archiveTemplate(uuid: string): Promise<Result<TaskTemplateServerDTO>> {
    return await this.taskTemplateService.archiveTaskTemplate(uuid);
  }
}
