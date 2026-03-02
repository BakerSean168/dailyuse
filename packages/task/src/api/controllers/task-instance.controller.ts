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
import type { TaskInstanceClientDTO, TaskInstanceStatus } from '@dailyuse/contracts/task';
import { formatZodErrors } from '@dailyuse/utils/result';
import type { CompleteTaskInstance } from '../../application-server/use-cases/commands/complete-task-instance';
import type { DeleteTaskInstance } from '../../application-server/use-cases/commands/delete-task-instance';
import type { GetTaskInstance } from '../../application-server/use-cases/queries/get-task-instance';
import type { GetTaskInstancesByDateRange } from '../../application-server/use-cases/queries/get-task-instances-by-date-range';
import type { ListTaskInstancesByAccount } from '../../application-server/use-cases/queries/list-task-instances-by-account';
import type { ListTaskInstancesByStatus } from '../../application-server/use-cases/queries/list-task-instances-by-status';
import type { ListTaskInstancesByTemplate } from '../../application-server/use-cases/queries/list-task-instances-by-template';
import type { SkipTaskInstance } from '../../application-server/use-cases/commands/skip-task-instance';
import type { StartTaskInstance } from '../../application-server/use-cases/commands/start-task-instance';

export interface TaskInstanceUseCases {
  getTaskInstance: GetTaskInstance;
  listByAccount: ListTaskInstancesByAccount;
  listByTemplate: ListTaskInstancesByTemplate;
  listByStatus: ListTaskInstancesByStatus;
  getByDateRange: GetTaskInstancesByDateRange;
  complete: CompleteTaskInstance;
  skip: SkipTaskInstance;
  start: StartTaskInstance;
  deleteInstance: DeleteTaskInstance;
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
    startDate: number,
    endDate: number,
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    const result = await this.useCases.getByDateRange.execute(identityId, startDate, endDate);

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
}
