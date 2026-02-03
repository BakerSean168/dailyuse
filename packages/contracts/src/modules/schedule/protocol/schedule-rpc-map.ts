import type {
  CreateScheduleRequest,
  UpdateScheduleRequest,
  ScheduleJobClientDTO,
  ConflictDetectionResult,
  CreateScheduleTaskRequest,
  UpdateScheduleTaskRequest,
  UpdateScheduleConfigRequest,
  UpdateTaskMetadataRequest,
  ScheduleTaskQueryParamsDTO,
  ScheduleTaskClientDTO,
  ScheduleTaskListResponseDTO,
  ScheduleExecutionQueryParamsDTO,
  ScheduleExecutionDTO,
  ScheduleExecutionListResponseDTO,
  ExecutionHistoryStatsDTO,
  ScheduleOperationSuccessResponseDTO,
} from '../api';

// === Schedule Module RPC Map ===
export type ScheduleRpcMap = {
  // === Schedule (Calendar Events) Operations ===
  'schedule:create': [CreateScheduleRequest, ScheduleJobClientDTO];
  'schedule:update': [UpdateScheduleRequest, ScheduleJobClientDTO];
  'schedule:delete': [{ scheduleId: string }, ScheduleOperationSuccessResponseDTO];
  'schedule:get-by-range': [{ startTime: number; endTime: number; accountUuid?: string }, ScheduleJobClientDTO[]];
  'schedule:detect-conflicts': [{ userId: string; startTime: number; endTime: number; excludeUuid?: string }, ConflictDetectionResult];
  'schedule:resolve-conflict': [{ resolution: string; newStartTime?: number; newEndTime?: number; newDuration?: number }, ScheduleJobClientDTO];
  
  // === Schedule Task Operations ===
  'schedule-task:create': [CreateScheduleTaskRequest, ScheduleTaskClientDTO];
  'schedule-task:update': [UpdateScheduleTaskRequest, ScheduleTaskClientDTO];
  'schedule-task:delete': [{ taskUuid: string }, ScheduleOperationSuccessResponseDTO];
  'schedule-task:query': [ScheduleTaskQueryParamsDTO, ScheduleTaskListResponseDTO];
  'schedule-task:enable': [{ taskUuid: string }, ScheduleTaskClientDTO];
  'schedule-task:disable': [{ taskUuid: string }, ScheduleTaskClientDTO];
  'schedule-task:update-config': [UpdateScheduleConfigRequest, ScheduleTaskClientDTO];
  'schedule-task:update-metadata': [UpdateTaskMetadataRequest, ScheduleTaskClientDTO];
  
  // === Schedule Execution Records ===
  'schedule-execution:query': [ScheduleExecutionQueryParamsDTO, ScheduleExecutionListResponseDTO];
  'schedule-execution:get-stats': [{ taskUuid: string }, ExecutionHistoryStatsDTO];
};
