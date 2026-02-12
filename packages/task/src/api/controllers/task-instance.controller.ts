/**
 * TaskInstance Controller
 * 
 * Handles HTTP request logic for task instance operations.
 * All methods call application services that return Result<T>.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { TaskInstanceClientDTO, TaskInstanceStatus } from '@dailyuse/contracts/task';
import type { TaskInstanceApplicationService } from '../../application-server/services/task-instance-application-service';

/**
 * TaskInstance Controller
 */
export class TaskInstanceController {
  constructor(
    private readonly taskInstanceService: TaskInstanceApplicationService
  ) {}

  /**
   * Get instance by ID
   */
  async getInstance(uuid: string): Promise<Result<TaskInstanceClientDTO | null>> {
    return await this.taskInstanceService.getTaskInstance(uuid);
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
      return await this.taskInstanceService.getTaskInstancesByTemplate(filters.templateUuid);
    } else if (filters?.status) {
      return await this.taskInstanceService.getTaskInstancesByStatus(accountUuid, filters.status);
    } else {
      return await this.taskInstanceService.getTaskInstancesByAccount(accountUuid);
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
    return await this.taskInstanceService.getTaskInstancesByDateRange(
      accountUuid,
      startDate,
      endDate
    );
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
    return await this.taskInstanceService.completeTaskInstance(uuid, params);
  }

  /**
   * Skip instance
   */
  async skipInstance(
    uuid: string,
    reason?: string
  ): Promise<Result<TaskInstanceClientDTO>> {
    return await this.taskInstanceService.skipTaskInstance(uuid, reason);
  }

  /**
   * Start instance
   */
  async startInstance(uuid: string): Promise<Result<TaskInstanceClientDTO>> {
    return await this.taskInstanceService.startTaskInstance(uuid);
  }

  /**
   * Delete instance
   */
  async deleteInstance(uuid: string): Promise<Result<void>> {
    return await this.taskInstanceService.deleteTaskInstance(uuid);
  }
}
