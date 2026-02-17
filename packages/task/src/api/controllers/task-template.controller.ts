/**
 * TaskTemplate Controller
 * 
 * Handles HTTP request logic for task template operations.
 * All methods call application services that return Result<T>.
 */

import type { Result } from '@dailyuse/contracts/result';
import { isOk, ok } from '@dailyuse/contracts/result';
import type { 
  TaskTemplateClientDTO,
  CreateTaskTemplateRequest,
  UpdateTaskTemplateRequest,
  TaskTemplateStatus 
} from '@dailyuse/contracts/task';
import type { CreateTaskTemplate } from '../../application-server/use-cases/commands/create-task-template';
import type { GetTaskTemplate } from '../../application-server/use-cases/queries/get-task-template';
import type { ListTaskTemplates } from '../../application-server/use-cases/queries/list-task-templates';
import type { UpdateTaskTemplate } from '../../application-server/use-cases/commands/update-task-template';
import type { DeleteTaskTemplate } from '../../application-server/use-cases/commands/delete-task-template';
import type { ActivateTaskTemplate } from '../../application-server/use-cases/commands/activate-task-template';
import type { PauseTaskTemplate } from '../../application-server/use-cases/commands/pause-task-template';
import type { ArchiveTaskTemplate } from '../../application-server/use-cases/commands/archive-task-template';

interface TaskTemplateUseCases {
  createTemplate: CreateTaskTemplate;
  getTemplate: GetTaskTemplate;
  listTemplates: ListTaskTemplates;
  updateTemplate: UpdateTaskTemplate;
  deleteTemplate: DeleteTaskTemplate;
  activateTemplate: ActivateTaskTemplate;
  pauseTemplate: PauseTaskTemplate;
  archiveTemplate: ArchiveTaskTemplate;
}

/**
 * TaskTemplate Controller
 */
export class TaskTemplateController {
  constructor(
    private readonly useCases: TaskTemplateUseCases,
  ) {}

  /**
   * Create new task template
   */
  async createTemplate(
    data: CreateTaskTemplateRequest,
    identityId: string
  ): Promise<Result<TaskTemplateClientDTO>> {
    const result = await this.useCases.createTemplate.execute({
      identityId,
      name: data.name,
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

    if (!isOk(result)) {
      return result as Result<TaskTemplateClientDTO>;
    }

    return ok(result.data.template);
  }

  /**
   * Get template by ID
   */
  async getTemplate(
    id: string,
    includeChildren = false
  ): Promise<Result<TaskTemplateClientDTO | null>> {
    const result = await this.useCases.getTemplate.execute(id, includeChildren);

    if (!isOk(result)) {
      return result as Result<TaskTemplateClientDTO | null>;
    }

    return ok(result.data.template ?? null);
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
  ): Promise<Result<TaskTemplateClientDTO[]>> {
    const result = await this.useCases.listTemplates.execute({
      identityId,
      status: filters?.status ? [filters.status] : undefined,
      folderId: filters?.folderId,
      goalId: filters?.goalId,
      tags: filters?.tags,
    } as any);

    if (!isOk(result)) {
      return result as Result<TaskTemplateClientDTO[]>;
    }

    return ok(result.data.templates);
  }

  /**
   * Update template
   */
  async updateTemplate(
    id: string,
    data: Partial<UpdateTaskTemplateRequest>
  ): Promise<Result<TaskTemplateClientDTO>> {
    return await this.useCases.updateTemplate.execute(id, {
      name: data.name,
      description: data.description,
      recurrenceRule: data.recurrenceRule,
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
    return await this.useCases.deleteTemplate.execute(id);
  }

  /**
   * Activate template
   */
  async activateTemplate(id: string): Promise<Result<TaskTemplateClientDTO>> {
    const result = await this.useCases.activateTemplate.execute(id);

    if (!isOk(result)) {
      return result as Result<TaskTemplateClientDTO>;
    }

    return ok(result.data.template);
  }

  /**
   * Pause template
   */
  async pauseTemplate(id: string): Promise<Result<TaskTemplateClientDTO>> {
    const result = await this.useCases.pauseTemplate.execute(id);

    if (!isOk(result)) {
      return result as Result<TaskTemplateClientDTO>;
    }

    return ok(result.data.template);
  }

  /**
   * Archive template
   */
  async archiveTemplate(id: string): Promise<Result<TaskTemplateClientDTO>> {
    return await this.useCases.archiveTemplate.execute(id);
  }
}
