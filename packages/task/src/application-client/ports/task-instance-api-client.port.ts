/**
 * Task Instance API Client Port
 *
 * Transport-agnostic interface for Task Instance API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 */

import type { Result } from '@memoflow/contracts/result';
import type {
  GetTaskInstancesByRangeReq,
  TaskInstanceClientDTO,
  CompleteTaskInstanceReq,
  MarkTaskInstanceMissedReq,
  SkipTaskInstanceReq,
  RescheduleTaskInput,
} from '@memoflow/contracts/task';

export interface ITaskInstanceApiClient {
  getTaskInstances(params?: {
    page?: number;
    limit?: number;
    templateId?: string;
    status?: string;
  }): Promise<Result<TaskInstanceClientDTO[]>>;
  getTaskInstancesByDateRange(
    request: GetTaskInstancesByRangeReq,
  ): Promise<Result<TaskInstanceClientDTO[]>>;
  getTaskInstanceById(id: string): Promise<Result<TaskInstanceClientDTO>>;
  deleteTaskInstance(id: string): Promise<Result<void>>;
  startTaskInstance(id: string): Promise<Result<TaskInstanceClientDTO>>;
  completeTaskInstance(
    id: string,
    request?: CompleteTaskInstanceReq,
  ): Promise<Result<TaskInstanceClientDTO>>;
  uncompleteTaskInstance(id: string): Promise<Result<TaskInstanceClientDTO>>;
  skipTaskInstance(
    id: string,
    request?: SkipTaskInstanceReq,
  ): Promise<Result<TaskInstanceClientDTO>>;
  markTaskInstanceMissed(
    id: string,
    request?: MarkTaskInstanceMissedReq,
  ): Promise<Result<TaskInstanceClientDTO>>;
  rescheduleTaskInstance(
    id: string,
    request: RescheduleTaskInput,
  ): Promise<Result<TaskInstanceClientDTO>>;
}
