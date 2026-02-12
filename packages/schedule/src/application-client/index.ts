/**
 * Schedule Application Module (Client)
 *
 * 日程管理模块 - 负责日程事件、调度任务和冲突检测
 */

// Container
// Smart Container
export { ScheduleApplicationService, scheduleApplicationService } from './schedule-application.service';

export { ScheduleContainer } from '../infrastructure-client/schedule.container';

// Services
export {
  // Events
  ScheduleTaskEvents,
  ScheduleEventEvents,
  type ScheduleTaskRefreshEvent,
  type ScheduleEventRefreshEvent,
  type ScheduleConflictEvent,
  
  // Schedule Task Use Cases
  CreateScheduleTask,
  CreateScheduleTasksBatch,
  ListScheduleTasks,
  GetScheduleTask,
  GetDueTasks,
  GetTaskBySource,
  PauseScheduleTask,
  ResumeScheduleTask,
  CompleteScheduleTask,
  CancelScheduleTask,
  DeleteScheduleTask,
  DeleteScheduleTasksBatch,
  UpdateTaskMetadata,
  GetScheduleStatistics,
  GetModuleStatistics,
  GetAllModuleStatistics,
  RecalculateStatistics,
  ResetStatistics,
  DeleteStatistics,
  
  // Schedule Event Use Cases
  CreateScheduleEvent,
  GetScheduleEvent,
  ListSchedulesByAccount,
  GetSchedulesByTimeRange,
  UpdateScheduleEvent,
  DeleteScheduleEvent,
  GetScheduleConflicts,
  
  // Schedule Conflict Use Cases
  DetectConflicts,
  CreateScheduleWithConflict,
  ResolveConflict,
} from './services';
