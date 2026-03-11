/**
 * TaskTemplate Controller
 *
 * Encapsulates Zod validation and use case orchestration for task templates.
 * Shared by both Express (HTTP) and IPC transport layers.
 *
 * Each method:
 * 1. Validates input via Zod schema (where applicable)
 * 2. Delegates to the corresponding use case
 * 3. Returns a Result<T> (transport-agnostic)
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail, isOk, ok } from '@dailyuse/contracts/result';
import {
  CreateTaskTemplateSchema,
  UpdateTaskTemplateSchema,
  GenerateInstancesSchema,
  BindToGoalSchema,
} from '@dailyuse/contracts/task';
import type {
  TaskTemplateClientDTO,
  TaskTemplateStatus,
  TaskInstanceClientDTO,
  CreateTaskTemplateReq,
  QueryTaskTemplatesReq,
} from '@dailyuse/contracts/task';
import { IdentityId } from '@dailyuse/domain-shared';
import { formatZodErrors } from '@dailyuse/utils/result';
import type { CreateTaskTemplate } from '../../application-server/use-cases/commands/create-task-template';
import type { GetTaskTemplate } from '../../application-server/use-cases/queries/get-task-template';
import type { ListTaskTemplates } from '../../application-server/use-cases/queries/list-task-templates';
import type { UpdateTaskTemplate } from '../../application-server/use-cases/commands/update-task-template';
import type { DeleteTaskTemplate } from '../../application-server/use-cases/commands/delete-task-template';
import type { ActivateTaskTemplate } from '../../application-server/use-cases/commands/activate-task-template';
import type { PauseTaskTemplate } from '../../application-server/use-cases/commands/pause-task-template';
import type { ArchiveTaskTemplate } from '../../application-server/use-cases/commands/archive-task-template';
import type { ListTaskTemplatesByPriority } from '../../application-server/use-cases/queries/list-task-templates-by-priority';
import type { GenerateTaskInstances } from '../../application-server/use-cases/commands/generate-task-instances';
import type { BindTaskToGoal } from '../../application-server/use-cases/commands/bind-task-to-goal';
import type { UnbindTaskFromGoal } from '../../application-server/use-cases/commands/unbind-task-from-goal';
import type { ListTaskInstancesByTemplate } from '../../application-server/use-cases/queries/list-task-instances-by-template';

export interface TaskTemplateUseCases {
  createTemplate: CreateTaskTemplate;
  getTemplate: GetTaskTemplate;
  listTemplates: ListTaskTemplates;
  updateTemplate: UpdateTaskTemplate;
  deleteTemplate: DeleteTaskTemplate;
  activateTemplate: ActivateTaskTemplate;
  pauseTemplate: PauseTaskTemplate;
  archiveTemplate: ArchiveTaskTemplate;
  listByPriority: ListTaskTemplatesByPriority;
  generateInstances: GenerateTaskInstances;
  bindToGoal: BindTaskToGoal;
  unbindFromGoal: UnbindTaskFromGoal;
  listInstancesByTemplate: ListTaskInstancesByTemplate;
}

/**
 * TaskTemplate Controller
 *
 * Provides validated use-case calls for the TaskTemplate module.
 * Used by both expressAdapter (HTTP) and ipcAdapter (IPC).
 */
export class TaskTemplateController {
  constructor(private readonly useCases: TaskTemplateUseCases) {}

  /**
   * Create new task template (with Zod validation)
   */
  async createTemplate(input: unknown, identityId: string): Promise<Result<TaskTemplateClientDTO>> {
    const parsed = CreateTaskTemplateSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    const result = await this.useCases.createTemplate.execute({
      identityId: identityId as CreateTaskTemplateReq['identityId'],
      name: parsed.data.name,
      description: parsed.data.description,
      taskType: parsed.data.taskType,
      timeConfig: parsed.data.timeConfig,
      recurrenceRule: parsed.data.recurrenceRule,
      reminderConfig: parsed.data.reminderConfig,
      importance: parsed.data.importance,
      folderId: parsed.data.folderId,
      tags: parsed.data.tags,
      color: parsed.data.color,
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
    includeChildren = false,
  ): Promise<Result<TaskTemplateClientDTO | null>> {
    const result = await this.useCases.getTemplate.execute(id, includeChildren);

    if (!isOk(result)) {
      return result as Result<TaskTemplateClientDTO | null>;
    }

    return ok(result.data ?? null);
  }

  /**
   * List templates for account
   */
  async listTemplates(
    identityId: string,
    filters?: {
      status?: TaskTemplateStatus;
      folderId?: QueryTaskTemplatesReq['folderId'];
      goalId?: QueryTaskTemplatesReq['goalId'];
      tags?: string[];
    },
  ): Promise<Result<{ templates: TaskTemplateClientDTO[]; total: number }>> {
    const request: QueryTaskTemplatesReq = {
      identityId: IdentityId.of(identityId) as QueryTaskTemplatesReq['identityId'],
      status: filters?.status ? [filters.status] : undefined,
      folderId: filters?.folderId,
      goalId: filters?.goalId,
      tags: filters?.tags,
    };

    const result = await this.useCases.listTemplates.execute(request);

    if (!isOk(result)) {
      return result as Result<{ templates: TaskTemplateClientDTO[]; total: number }>;
    }

    return ok({ templates: result.data.templates, total: result.data.total });
  }

  /**
   * Update template (with Zod validation)
   */
  async updateTemplate(id: string, input: unknown): Promise<Result<TaskTemplateClientDTO>> {
    const parsed = UpdateTaskTemplateSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return await this.useCases.updateTemplate.execute(id, {
      name: parsed.data.name,
      description: parsed.data.description,
      timeConfig: parsed.data.timeConfig,
      recurrenceRule: parsed.data.recurrenceRule,
      importance: parsed.data.importance,
      folderId: parsed.data.folderId,
      tags: parsed.data.tags,
      color: parsed.data.color,
    });
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<Result<void>> {
    const result = await this.useCases.deleteTemplate.execute(id);
    if (!isOk(result)) {
      return result as Result<void>;
    }
    return ok(undefined);
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

  /**
   * List templates sorted by priority
   */
  async listByPriority(
    identityId: string,
    limit?: number,
  ): Promise<Result<TaskTemplateClientDTO[]>> {
    return await this.useCases.listByPriority.execute(identityId, limit);
  }

  /**
   * Generate instances for a template
   */
  async generateInstances(id: string, input: unknown): Promise<Result<TaskInstanceClientDTO[]>> {
    const parsed = GenerateInstancesSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return await this.useCases.generateInstances.execute(id, parsed.data);
  }

  /**
   * Get instances by template ID
   */
  async getInstancesByTemplate(templateId: string): Promise<Result<TaskInstanceClientDTO[]>> {
    return await this.useCases.listInstancesByTemplate.execute(templateId);
  }

  /**
   * Bind template to goal
   */
  async bindToGoal(id: string, input: unknown): Promise<Result<TaskTemplateClientDTO>> {
    const parsed = BindToGoalSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return await this.useCases.bindToGoal.execute(id, parsed.data);
  }

  /**
   * Unbind template from goal
   */
  async unbindFromGoal(id: string): Promise<Result<TaskTemplateClientDTO>> {
    return await this.useCases.unbindFromGoal.execute(id);
  }
}
