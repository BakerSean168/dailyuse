import type { Result } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import type {
  BatchScheduleTaskOperationRequest,
  CreateScheduleRequest,
  CreateScheduleTaskRequest,
  DetectConflictsInternalQuery,
  GetSchedulesByTimeRangeInternalQuery,
  ResolveConflictRequest,
  UpdateScheduleRequest,
  UpdateScheduleTaskRequest,
  UpdateTaskMetadataRequest,
} from '@dailyuse/contracts/schedule';

/**
 * Transport-neutral callable application surface for schedule tasks.
 */
export interface ScheduleApplicationPort {
  createTask(data: CreateScheduleTaskRequest, ctx: Context): Promise<Result<unknown>>;
  listTasks(query: Record<string, unknown>, ctx: Context): Promise<Result<unknown>>;
  getTask(id: string): Promise<Result<unknown>>;
  updateTask(id: string, data: UpdateScheduleTaskRequest): Promise<Result<unknown>>;
  deleteTask(id: string): Promise<Result<unknown>>;
  pauseTask(id: string): Promise<Result<unknown>>;
  resumeTask(id: string): Promise<Result<unknown>>;
  triggerTask(id: string): Promise<Result<unknown>>;
  completeTask(id: string): Promise<Result<unknown>>;
  cancelTask(id: string, reason: string): Promise<Result<unknown>>;
  getDueTasks(ctx: Context): Promise<Result<unknown>>;
  batchOperateTasks(data: BatchScheduleTaskOperationRequest): Promise<Result<unknown>>;
  batchDeleteTasks(ids: string[]): Promise<Result<unknown>>;
  updateTaskMetadata(id: string, metadata: UpdateTaskMetadataRequest): Promise<Result<unknown>>;
}

/**
 * Transport-neutral callable application surface for schedule events.
 */
export interface ScheduleEventApplicationPort {
  createEvent(data: CreateScheduleRequest, ctx: Context): Promise<Result<unknown>>;
  getEvent(id: string): Promise<Result<unknown>>;
  listEvents(query: GetSchedulesByTimeRangeInternalQuery, ctx: Context): Promise<Result<unknown>>;
  updateEvent(id: string, data: UpdateScheduleRequest): Promise<Result<unknown>>;
  deleteEvent(id: string): Promise<Result<unknown>>;
  getConflicts(id: string): Promise<Result<unknown>>;
  detectConflicts(data: DetectConflictsInternalQuery): Promise<Result<unknown>>;
  createEventWithConflictDetection(
    data: CreateScheduleRequest,
    ctx: Context,
  ): Promise<Result<unknown>>;
  resolveConflict(id: string, data: ResolveConflictRequest): Promise<Result<unknown>>;
}
