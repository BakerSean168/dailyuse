/**
 * Schedule Task API Client Port
 *
 * Transport-agnostic interface for Schedule Task API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @dailyuse/contracts/schedule.
 */

import type { Result } from '@dailyuse/contracts/result';
import type {
  SourceModule,
  ScheduleTaskClientDTO,
  CreateScheduleTaskRequest,
} from '@dailyuse/contracts/schedule';

/**
 * IScheduleTaskApiClient
 *
 * 调度任务 API 客户端接口
 */
export interface IScheduleTaskApiClient {
  // ===== Schedule Task CRUD =====
  createTask(request: CreateScheduleTaskRequest): Promise<Result<ScheduleTaskClientDTO>>;
  createTasksBatch(tasks: CreateScheduleTaskRequest[]): Promise<Result<ScheduleTaskClientDTO[]>>;
  getTasks(): Promise<Result<{ tasks: ScheduleTaskClientDTO[]; total: number }>>;
  getTaskById(taskId: string): Promise<Result<ScheduleTaskClientDTO>>;
  getDueTasks(params?: {
    beforeTime?: string;
    limit?: number;
  }): Promise<Result<ScheduleTaskClientDTO[]>>;
  getTaskBySource(
    sourceModule: SourceModule,
    sourceEntityId: string,
  ): Promise<Result<ScheduleTaskClientDTO[]>>;

  // ===== Schedule Task Status Management =====
  pauseTask(taskId: string): Promise<Result<void>>;
  resumeTask(taskId: string): Promise<Result<void>>;
  completeTask(taskId: string, reason?: string): Promise<Result<void>>;
  cancelTask(taskId: string, reason?: string): Promise<Result<void>>;
  deleteTask(taskId: string): Promise<Result<void>>;
  deleteTasksBatch(taskIds: string[]): Promise<Result<void>>;
  updateTaskMetadata(
    taskId: string,
    metadata: { payload?: unknown; tagsToAdd?: string[]; tagsToRemove?: string[] },
  ): Promise<Result<void>>;
}
