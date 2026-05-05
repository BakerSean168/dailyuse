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

import type { Result } from '@dailyuse/contracts/result';
import { fail, isOk, ok } from '@dailyuse/contracts/result';
import { CompleteTaskInstanceSchema, SkipTaskInstanceSchema } from '@dailyuse/contracts/task';
import type {
  CheckExpiredTaskInstancesRes,
  GetTaskInstancesByRangeReq,
  TaskInstanceClientDTO,
  TaskInstanceStatus,
} from '@dailyuse/contracts/task';
import { formatZodErrors } from '@dailyuse/utils/result';
import type { CompleteTaskInstanceUseCase } from '../application-server/use-cases/commands/complete-task-instance.use-case';
import type { DeleteTaskInstanceUseCase } from '../application-server/use-cases/commands/delete-task-instance.use-case';
import type { GetTaskInstanceUseCase } from '../application-server/use-cases/queries/get-task-instance.use-case';
import type { GetTaskInstancesByDateRangeUseCase } from '../application-server/use-cases/queries/get-task-instances-by-date-range.use-case';
import type { ListTaskInstancesByAccountUseCase } from '../application-server/use-cases/queries/list-task-instances-by-account.use-case';
import type { ListTaskInstancesByStatusUseCase } from '../application-server/use-cases/queries/list-task-instances-by-status.use-case';
import type { ListTaskInstancesByTemplateUseCase } from '../application-server/use-cases/queries/list-task-instances-by-template.use-case';
import type { SkipTaskInstanceUseCase } from '../application-server/use-cases/commands/skip-task-instance.use-case';
import type { StartTaskInstanceUseCase } from '../application-server/use-cases/commands/start-task-instance.use-case';
import type { CheckExpiredInstancesUseCase } from '../application-server/use-cases/commands/check-expired-instances.use-case';

export interface TaskInstanceUseCases {
  getTaskInstance: GetTaskInstanceUseCase;
  listByAccount: ListTaskInstancesByAccountUseCase;
  listByTemplate: ListTaskInstancesByTemplateUseCase;
  listByStatus: ListTaskInstancesByStatusUseCase;
  getByDateRange: GetTaskInstancesByDateRangeUseCase;
  complete: CompleteTaskInstanceUseCase;
  skip: SkipTaskInstanceUseCase;
  start: StartTaskInstanceUseCase;
  deleteInstance: DeleteTaskInstanceUseCase;
  checkExpired: CheckExpiredInstancesUseCase;
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
  async getInstance(id: string): Promise<Result<TaskInstanceClientDTO | null>> {
    return await this.useCases.getTaskInstance.execute(id);
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
      return await this.useCases.listByTemplate.execute(filters.templateId);
    } else if (filters?.status) {
      return await this.useCases.listByStatus.execute(identityId, filters.status);
    } else {
      return await this.useCases.listByAccount.execute(identityId);
    }
  }

  /**
   * Get instances by date range
   */
  async getInstancesByDateRange(
    identityId: string,
    request: GetTaskInstancesByRangeReq,
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    const result = await this.useCases.getByDateRange.execute(
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
  async completeInstance(id: string, input: unknown): Promise<Result<TaskInstanceClientDTO>> {
    const parsed = CompleteTaskInstanceSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    const result = await this.useCases.complete.execute(id, parsed.data);
    if (!isOk(result)) {
      return result as Result<TaskInstanceClientDTO>;
    }

    return ok(result.data.instance);
  }

  /**
   * Skip instance (with Zod validation)
   */
  async skipInstance(id: string, input: unknown): Promise<Result<TaskInstanceClientDTO>> {
    const parsed = SkipTaskInstanceSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    const result = await this.useCases.skip.execute(id, parsed.data);
    if (!isOk(result)) {
      return result as Result<TaskInstanceClientDTO>;
    }

    return ok(result.data.instance);
  }

  /**
   * Start instance
   */
  async startInstance(id: string): Promise<Result<TaskInstanceClientDTO>> {
    return await this.useCases.start.execute(id);
  }

  /**
   * Delete instance
   */
  async deleteInstance(id: string): Promise<Result<void>> {
    return await this.useCases.deleteInstance.execute(id);
  }

  /**
   * Check and mark expired instances
   */
  async checkExpired(identityId: string): Promise<Result<CheckExpiredTaskInstancesRes>> {
    const result = await this.useCases.checkExpired.execute(identityId);

    if (!isOk(result)) {
      return result as Result<CheckExpiredTaskInstancesRes>;
    }

    return ok({
      count: result.data.length,
      instances: result.data,
    });
  }
}
