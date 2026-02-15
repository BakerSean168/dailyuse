/**
 * TaskInstance Controller
 * 
 * Handles HTTP request logic for task instance operations.
 * All methods call application services that return Result<T>.
 */

import type { Result } from '@dailyuse/contracts/result';
import { isOk, ok } from '@dailyuse/contracts/result';
import type { TaskInstanceClientDTO, TaskInstanceStatus } from '@dailyuse/contracts/task';
import type { CompleteTaskInstance } from '../../application-server/services/complete-task-instance';
import type { DeleteTaskInstance } from '../../application-server/services/delete-task-instance';
import type { GetTaskInstance } from '../../application-server/services/get-task-instance';
import type { GetTaskInstancesByDateRange } from '../../application-server/services/get-task-instances-by-date-range';
import type { ListTaskInstancesByAccount } from '../../application-server/services/list-task-instances-by-account';
import type { ListTaskInstancesByStatus } from '../../application-server/services/list-task-instances-by-status';
import type { ListTaskInstancesByTemplate } from '../../application-server/services/list-task-instances-by-template';
import type { SkipTaskInstance } from '../../application-server/services/skip-task-instance';
import type { StartTaskInstance } from '../../application-server/services/start-task-instance';

interface TaskInstanceUseCases {
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
 */
export class TaskInstanceController {
  constructor(
    private readonly useCases: TaskInstanceUseCases
  ) {}

  /**
   * Get instance by ID
   */
  async getInstance(uuid: string): Promise<Result<TaskInstanceClientDTO | null>> {
    return await this.useCases.getTaskInstance.execute(uuid);
  }

  /**
   * List instances for account
   */
  async listInstances(
    accountUuid: string,
    filters?: {
      templateUuid?: string;
      status?: TaskInstanceStatus;
    }
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    if (filters?.templateUuid) {
      return await this.useCases.listByTemplate.execute(filters.templateUuid);
    } else if (filters?.status) {
      return await this.useCases.listByStatus.execute(accountUuid, filters.status);
    } else {
      return await this.useCases.listByAccount.execute(accountUuid);
    }
  }

  /**
   * Get instances by date range
   */
  async getInstancesByDateRange(
    accountUuid: string,
    startDate: number,
    endDate: number
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    const result = await this.useCases.getByDateRange.execute(
      accountUuid,
      startDate,
      endDate,
    );

    if (!isOk(result)) {
      return result as Result<TaskInstanceClientDTO[]>;
    }

    return ok(result.data.instances);
  }

  /**
   * Complete instance
   */
  async completeInstance(
    uuid: string,
    params: {
      duration?: number;
      note?: string;
      rating?: number;
    }
  ): Promise<Result<TaskInstanceClientDTO>> {
    const result = await this.useCases.complete.execute(uuid, params);
    if (!isOk(result)) {
      return result as Result<TaskInstanceClientDTO>;
    }

    return ok(result.data.instance);
  }

  /**
   * Skip instance
   */
  async skipInstance(
    uuid: string,
    reason?: string
  ): Promise<Result<TaskInstanceClientDTO>> {
    const result = await this.useCases.skip.execute(uuid, { reason });
    if (!isOk(result)) {
      return result as Result<TaskInstanceClientDTO>;
    }

    return ok(result.data.instance);
  }

  /**
   * Start instance
   */
  async startInstance(uuid: string): Promise<Result<TaskInstanceClientDTO>> {
    return await this.useCases.start.execute(uuid);
  }

  /**
   * Delete instance
   */
  async deleteInstance(uuid: string): Promise<Result<void>> {
    return await this.useCases.deleteInstance.execute(uuid);
  }
}
