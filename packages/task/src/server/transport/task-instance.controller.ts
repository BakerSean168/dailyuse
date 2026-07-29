/**
 * TaskInstance Controller
 *
 * Encapsulates Zod validation and use case orchestration for task instances.
 * Shared by both Express (HTTP) and IPC transport layers.
 *
 * Each method:
 * 1. Validates input via Zod schema (where applicable)
 * 2. Delegates to the corresponding use case
 * 3. Returns a Result<T> (transport-agnostic)
 */

import type { Result } from '@memoflow/contracts/result';
import type { Context } from '@memoflow/contracts/shared';
import { fail, isOk, ok } from '@memoflow/contracts/result';
import { CompleteTaskInstanceSchema, SkipTaskInstanceSchema } from '@memoflow/contracts/task';
import type {
  CheckExpiredTaskInstancesRes,
  GetTaskInstancesByRangeReq,
  TaskInstanceClientDTO,
  TaskInstanceStatus,
} from '@memoflow/contracts/task';
import { formatZodErrors } from '@memoflow/utils/result';
import type { CompleteTaskInstanceUseCase } from '../application/use-cases/commands/complete-task-instance.use-case';
import type { DeleteTaskInstanceUseCase } from '../application/use-cases/commands/delete-task-instance.use-case';
import type { GetTaskInstanceUseCase } from '../application/use-cases/queries/get-task-instance.use-case';
import type { GetTaskInstancesByDateRangeUseCase } from '../application/use-cases/queries/get-task-instances-by-date-range.use-case';
import type { ListTaskInstancesByAccountUseCase } from '../application/use-cases/queries/list-task-instances-by-account.use-case';
import type { ListTaskInstancesByStatusUseCase } from '../application/use-cases/queries/list-task-instances-by-status.use-case';
import type { ListTaskInstancesByTemplateUseCase } from '../application/use-cases/queries/list-task-instances-by-template.use-case';
import type { SkipTaskInstanceUseCase } from '../application/use-cases/commands/skip-task-instance.use-case';
import type { StartTaskInstanceUseCase } from '../application/use-cases/commands/start-task-instance.use-case';
import type { CheckExpiredInstancesUseCase } from '../application/use-cases/commands/check-expired-instances.use-case';

type TaskControllerFn<T extends (...args: never[]) => unknown> = (
  ...args: Parameters<T>
) => ReturnType<T>;

export interface TaskInstanceUseCases {
  getTaskInstance: TaskControllerFn<GetTaskInstanceUseCase['execute']>;
  listByAccount: TaskControllerFn<ListTaskInstancesByAccountUseCase['execute']>;
  listByTemplate: TaskControllerFn<ListTaskInstancesByTemplateUseCase['execute']>;
  listByStatus: TaskControllerFn<ListTaskInstancesByStatusUseCase['execute']>;
  getByDateRange: TaskControllerFn<GetTaskInstancesByDateRangeUseCase['execute']>;
  complete: TaskControllerFn<CompleteTaskInstanceUseCase['execute']>;
  skip: TaskControllerFn<SkipTaskInstanceUseCase['execute']>;
  start: TaskControllerFn<StartTaskInstanceUseCase['execute']>;
  deleteInstance: TaskControllerFn<DeleteTaskInstanceUseCase['execute']>;
  checkExpired: TaskControllerFn<CheckExpiredInstancesUseCase['execute']>;
}

/**
 * TaskInstance Controller
 *
 * Provides validated use-case calls for the TaskInstance module.
 * Used by both expressAdapter (HTTP) and ipcAdapter (IPC).
 */
export class TaskInstanceController {
  constructor(private readonly useCases: TaskInstanceUseCases) {}

  /**
   * Get instance by ID
   */
  async getInstance(id: string, ctx: Context): Promise<Result<TaskInstanceClientDTO | null>> {
    return await this.useCases.getTaskInstance(id, ctx.identityId);
  }

  /**
   * List instances for account
   */
  async listInstances(
    identityId: string,
    filters?: {
      templateId?: string;
      status?: TaskInstanceStatus;
    },
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    if (filters?.templateId) {
      return await this.useCases.listByTemplate(filters.templateId, identityId);
    } else if (filters?.status) {
      return await this.useCases.listByStatus(identityId, filters.status);
    } else {
      return await this.useCases.listByAccount(identityId);
    }
  }

  /**
   * Get instances by date range
   */
  async getInstancesByDateRange(
    identityId: string,
    request: GetTaskInstancesByRangeReq,
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    const result = await this.useCases.getByDateRange(
      identityId,
      request.startDate,
      request.endDate,
    );

    if (!isOk(result)) {
      return result as Result<TaskInstanceClientDTO[]>;
    }

    return ok(result.data.data);
  }

  /**
   * Complete instance (with Zod validation)
   */
  async completeInstance(
    id: string,
    input: unknown,
    ctx: Context,
  ): Promise<Result<TaskInstanceClientDTO>> {
    const parsed = CompleteTaskInstanceSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    const result = await this.useCases.complete(id, ctx.identityId, parsed.data);
    if (!isOk(result)) {
      return result as Result<TaskInstanceClientDTO>;
    }

    return ok(result.data.instance);
  }

  /**
   * Skip instance (with Zod validation)
   */
  async skipInstance(
    id: string,
    input: unknown,
    ctx: Context,
  ): Promise<Result<TaskInstanceClientDTO>> {
    const parsed = SkipTaskInstanceSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    const result = await this.useCases.skip(id, ctx.identityId, parsed.data);
    if (!isOk(result)) {
      return result as Result<TaskInstanceClientDTO>;
    }

    return ok(result.data.instance);
  }

  /**
   * Start instance
   */
  async startInstance(id: string, ctx: Context): Promise<Result<TaskInstanceClientDTO>> {
    return await this.useCases.start(id, ctx.identityId);
  }

  /**
   * Delete instance
   */
  async deleteInstance(id: string, ctx: Context): Promise<Result<null>> {
    const result = await this.useCases.deleteInstance(id, ctx.identityId);
    if (!isOk(result)) {
      return result as Result<null>;
    }
    // Serialize as data:null (no Result.void / undefined dual-track).
    return ok(null);
  }

  /**
   * Check and mark expired instances
   */
  async checkExpired(identityId: string): Promise<Result<CheckExpiredTaskInstancesRes>> {
    const result = await this.useCases.checkExpired(identityId);

    if (!isOk(result)) {
      return result as Result<CheckExpiredTaskInstancesRes>;
    }

    return ok({
      count: result.data.length,
      instances: result.data,
    });
  }
}
