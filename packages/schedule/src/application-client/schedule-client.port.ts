import type { Result } from '@memoflow/contracts/result';
import type {
  CalendarEntryClientDTO,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  GetSchedulesByTimeRangeRequest,
  ConflictDetectionResult,
  ResolveConflictRequest,
  SourceModule,
  CreateScheduleTaskRequest,
  UpdateTaskMetadataRequest,
  ScheduleBatchOperationResponseDTO,
} from '@memoflow/contracts/schedule';
import type { ScheduleTask } from '../domain-client/aggregates/schedule-task';

/**
 * Product-facing Schedule capability.
 *
 * Calendar entries remain normal product commands. Raw ScheduleTask worker jobs
 * are inspectable for diagnostics but are not mutable from Web/Desktop product UI.
 */
export interface ScheduleProductClientPort {
  createSchedule(data: CreateScheduleRequest): Promise<Result<CalendarEntryClientDTO>>;
  getSchedule(id: string): Promise<Result<CalendarEntryClientDTO>>;
  getSchedulesByAccount(): Promise<Result<CalendarEntryClientDTO[]>>;
  getSchedulesByTimeRange(
    params: GetSchedulesByTimeRangeRequest,
  ): Promise<Result<CalendarEntryClientDTO[]>>;
  updateSchedule(id: string, data: UpdateScheduleRequest): Promise<Result<CalendarEntryClientDTO>>;
  deleteSchedule(id: string, expectedVersion: number): Promise<Result<void>>;

  getScheduleConflicts(id: string): Promise<Result<ConflictDetectionResult>>;
  detectConflicts(params: {
    startTime: number;
    endTime: number;
    excludeId?: string;
  }): Promise<Result<ConflictDetectionResult>>;
  createScheduleWithConflictDetection(
    request: CreateScheduleRequest,
  ): Promise<Result<{ schedule: CalendarEntryClientDTO; conflicts?: ConflictDetectionResult }>>;
  resolveConflict(
    scheduleId: string,
    request: ResolveConflictRequest,
  ): Promise<
    Result<{
      schedule: CalendarEntryClientDTO;
      conflicts: ConflictDetectionResult;
      applied: {
        strategy: string;
        previousStartTime?: number;
        previousEndTime?: number;
        changes: string[];
      };
    }>
  >;

  // Raw Scheduler worker diagnostics — intentionally read-only.
  getTasks(): Promise<Result<ScheduleTask[]>>;
  getTaskById(taskId: string): Promise<Result<ScheduleTask>>;
  getDueTasks(params?: { beforeTime?: string; limit?: number }): Promise<Result<ScheduleTask[]>>;
  getTaskBySource(
    sourceModule: SourceModule,
    sourceEntityId: string,
  ): Promise<Result<ScheduleTask[]>>;
}

/**
 * Full transport-compatibility capability retained for the deferred Mobile HTTP lane.
 * Do not inject this port into ordinary Web/Desktop product UI.
 */
export interface ScheduleClientPort extends ScheduleProductClientPort {
  createTask(request: CreateScheduleTaskRequest): Promise<Result<ScheduleTask>>;
  createTasksBatch(tasks: CreateScheduleTaskRequest[]): Promise<Result<ScheduleTask[]>>;
  pauseTask(taskId: string): Promise<Result<ScheduleTask>>;
  resumeTask(taskId: string): Promise<Result<ScheduleTask>>;
  completeTask(taskId: string, reason?: string): Promise<Result<ScheduleTask>>;
  cancelTask(taskId: string, reason?: string): Promise<Result<ScheduleTask>>;
  deleteTask(taskId: string): Promise<Result<void>>;
  deleteTasksBatch(taskIds: string[]): Promise<Result<ScheduleBatchOperationResponseDTO>>;
  updateTaskMetadata(
    taskId: string,
    metadata: UpdateTaskMetadataRequest,
  ): Promise<Result<ScheduleTask>>;
}
