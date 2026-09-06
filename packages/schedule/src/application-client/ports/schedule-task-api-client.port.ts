/**
 * Schedule Task API Client Ports
 *
 * Raw ScheduleTask worker jobs are an internal scheduling primitive. Product
 * surfaces may inspect them for diagnostics, but only the temporary HTTP/Mobile
 * compatibility seam is allowed to mutate them directly.
 */

import type { Result } from '@memoflow/contracts/result';
import type {
  SourceModule,
  ScheduleTaskClientDTO,
  CreateScheduleTaskRequest,
  UpdateTaskMetadataRequest,
  ScheduleBatchOperationResponseDTO,
} from '@memoflow/contracts/schedule';

/** Read-only raw worker-job diagnostics shared by Web/Desktop product surfaces. */
export interface IScheduleTaskQueryApiClient {
  getTasks(): Promise<Result<ScheduleTaskClientDTO[]>>;
  getTaskById(taskId: string): Promise<Result<ScheduleTaskClientDTO>>;
  getDueTasks(params?: {
    beforeTime?: string;
    limit?: number;
  }): Promise<Result<ScheduleTaskClientDTO[]>>;
  getTaskBySource(
    sourceModule: SourceModule,
    sourceEntityId: string,
  ): Promise<Result<ScheduleTaskClientDTO[]>>;
}

/**
 * Full raw worker-job API retained only for transport compatibility (Mobile HTTP).
 * Ordinary Web/Desktop product code must depend on IScheduleTaskQueryApiClient.
 */
export interface IScheduleTaskApiClient extends IScheduleTaskQueryApiClient {
  createTask(request: CreateScheduleTaskRequest): Promise<Result<ScheduleTaskClientDTO>>;
  createTasksBatch(tasks: CreateScheduleTaskRequest[]): Promise<Result<ScheduleTaskClientDTO[]>>;
  pauseTask(taskId: string): Promise<Result<ScheduleTaskClientDTO>>;
  resumeTask(taskId: string): Promise<Result<ScheduleTaskClientDTO>>;
  completeTask(taskId: string, reason?: string): Promise<Result<ScheduleTaskClientDTO>>;
  cancelTask(taskId: string, reason?: string): Promise<Result<ScheduleTaskClientDTO>>;
  deleteTask(taskId: string): Promise<Result<void>>;
  deleteTasksBatch(taskIds: string[]): Promise<Result<ScheduleBatchOperationResponseDTO>>;
  updateTaskMetadata(
    taskId: string,
    metadata: UpdateTaskMetadataRequest,
  ): Promise<Result<ScheduleTaskClientDTO>>;
}
