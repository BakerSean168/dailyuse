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
  TaskInstanceClientDTO,
  CreateTaskTemplateInput,
  ListTaskTemplateFilters,
  QueryTaskTemplateGraphRes,
  QueryTaskTemplatesInternal,
} from '@dailyuse/contracts/task';
import type { Context } from '@dailyuse/contracts/shared';
import type { TaskFolderId, GoalId } from '@dailyuse/contracts/primitives';
import { IdentityId } from '@dailyuse/domain-shared';
import { formatZodErrors } from '@dailyuse/utils/result';
import type { CreateTaskTemplateUseCase } from '../application-server/use-cases/commands/create-task-template.use-case';
import type { GetTaskTemplateUseCase } from '../application-server/use-cases/queries/get-task-template.use-case';
import type { ListTaskTemplatesUseCase } from '../application-server/use-cases/queries/list-task-templates.use-case';
import type { UpdateTaskTemplateUseCase } from '../application-server/use-cases/commands/update-task-template.use-case';
import type { DeleteTaskTemplateUseCase } from '../application-server/use-cases/commands/delete-task-template.use-case';
import type { ActivateTaskTemplateUseCase } from '../application-server/use-cases/commands/activate-task-template.use-case';
import type { PauseTaskTemplateUseCase } from '../application-server/use-cases/commands/pause-task-template.use-case';
import type { ArchiveTaskTemplateUseCase } from '../application-server/use-cases/commands/archive-task-template.use-case';
import type { ListTaskTemplatesByPriorityUseCase } from '../application-server/use-cases/queries/list-task-templates-by-priority.use-case';
import type { GenerateTaskInstancesUseCase } from '../application-server/use-cases/commands/generate-task-instances.use-case';
import type { BindTaskToGoalUseCase } from '../application-server/use-cases/commands/bind-task-to-goal.use-case';
import type { UnbindTaskFromGoalUseCase } from '../application-server/use-cases/commands/unbind-task-from-goal.use-case';
import type { ListTaskInstancesByTemplateUseCase } from '../application-server/use-cases/queries/list-task-instances-by-template.use-case';
import type { GetTaskTemplateGraphUseCase } from '../application-server/use-cases/queries/get-task-template-graph.use-case';

export interface TaskTemplateUseCases {
  createTemplate: CreateTaskTemplateUseCase;
  getTemplate: GetTaskTemplateUseCase;
  listTemplates: ListTaskTemplatesUseCase;
  getTaskGraph: GetTaskTemplateGraphUseCase;
  updateTemplate: UpdateTaskTemplateUseCase;
  deleteTemplate: DeleteTaskTemplateUseCase;
  activateTemplate: ActivateTaskTemplateUseCase;
  pauseTemplate: PauseTaskTemplateUseCase;
  archiveTemplate: ArchiveTaskTemplateUseCase;
  listByPriority: ListTaskTemplatesByPriorityUseCase;
  generateInstances: GenerateTaskInstancesUseCase;
  bindToGoal: BindTaskToGoalUseCase;
  unbindFromGoal: UnbindTaskFromGoalUseCase;
  listInstancesByTemplate: ListTaskInstancesByTemplateUseCase;
}

/**
 * TaskTemplate Controller
 *
 * Provides validated use-case calls for the TaskTemplate module.
 * Used by both expressAdapter (HTTP) and ipcAdapter (IPC).
 */
export class TaskTemplateController {
  constructor(private readonly useCases: TaskTemplateUseCases) {}

  private toTemplateQuery(
    filters: ListTaskTemplateFilters | undefined,
    ctx: Context,
  ): QueryTaskTemplatesInternal {
    return {
      identityId: IdentityId.of(ctx.identityId),
      status: filters?.status,
      folderId: filters?.folderId as TaskFolderId | undefined,
      goalId: filters?.goalId as GoalId | undefined,
      tags: filters?.tags,
    };
  }

  /**
   * Create new task template (with Zod validation)
   * Identity is injected from Context, not from request payload
   */
  async createTemplate(input: unknown, ctx: Context): Promise<Result<TaskTemplateClientDTO>> {
    const parsed = CreateTaskTemplateSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    // Assemble internal input with identityId from Context
    const createInput: CreateTaskTemplateInput = {
      identityId: IdentityId.of(ctx.identityId),
      name: parsed.data.name,
      description: parsed.data.description,
      taskType: parsed.data.taskType,
      timeConfig: parsed.data.timeConfig,
      recurrenceRule: parsed.data.recurrenceRule,
      reminderConfig: parsed.data.reminderConfig,
      importance: parsed.data.importance,
      parentTaskId: parsed.data.parentTaskId,
      folderId: parsed.data.folderId,
      tags: parsed.data.tags,
      color: parsed.data.color,
      goalBinding: parsed.data.goalBinding,
    };

    const result = await this.useCases.createTemplate.execute(createInput);

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
   * Identity is injected from Context, not from request payload
   */
  async listTemplates(
    filters: ListTaskTemplateFilters | undefined,
    ctx: Context,
  ): Promise<Result<{ templates: TaskTemplateClientDTO[]; total: number }>> {
    const result = await this.useCases.listTemplates.execute(this.toTemplateQuery(filters, ctx));

    if (!isOk(result)) {
      return result as Result<{ templates: TaskTemplateClientDTO[]; total: number }>;
    }

    return ok({ templates: result.data.templates, total: result.data.total });
  }

  /**
   * List templates together with the dependency edges between them.
   */
  async getTaskGraph(
    filters: ListTaskTemplateFilters | undefined,
    ctx: Context,
  ): Promise<Result<QueryTaskTemplateGraphRes>> {
    const result = await this.useCases.getTaskGraph.execute(this.toTemplateQuery(filters, ctx));

    if (!isOk(result)) {
      return result as Result<QueryTaskTemplateGraphRes>;
    }

    return ok(result.data);
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
      reminderConfig: parsed.data.reminderConfig,
      importance: parsed.data.importance,
      parentTaskId: parsed.data.parentTaskId,
      folderId: parsed.data.folderId,
      tags: parsed.data.tags,
      color: parsed.data.color,
      goalBinding: parsed.data.goalBinding,
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
   * Identity is injected from Context, not from request payload
   */
  async listByPriority(ctx: Context, limit?: number): Promise<Result<TaskTemplateClientDTO[]>> {
    return await this.useCases.listByPriority.execute(ctx.identityId, limit);
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
