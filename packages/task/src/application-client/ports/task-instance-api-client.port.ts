/**
 * Task Instance API Client Port
 *
 * Transport-agnostic interface for Task Instance API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 */

import type { Result } from '@dailyuse/contracts/result';
import type {
  TaskInstanceClientDTO,
  CompleteTaskInstanceReq,
  SkipTaskInstanceReq,
} from '@dailyuse/contracts/task';

export interface ITaskInstanceApiClient {
  getTaskInstances(params?: {
    page?: number;
    limit?: number;
    templateId?: string;
    status?: string;
  }): Promise<Result<TaskInstanceClientDTO[]>>;
  getTaskInstancesByDateRange(
    startDate: number,
    endDate: number,
  ): Promise<Result<TaskInstanceClientDTO[]>>;
  getTaskInstanceById(id: string): Promise<Result<TaskInstanceClientDTO>>;
  deleteTaskInstance(id: string): Promise<Result<void>>;
  startTaskInstance(id: string): Promise<Result<TaskInstanceClientDTO>>;
  completeTaskInstance(
    id: string,
    request?: CompleteTaskInstanceReq,
  ): Promise<Result<TaskInstanceClientDTO>>;
  skipTaskInstance(
    id: string,
    request?: SkipTaskInstanceReq,
  ): Promise<Result<TaskInstanceClientDTO>>;
  checkExpiredInstances(): Promise<Result<{ count: number; instances: TaskInstanceClientDTO[] }>>;
}
