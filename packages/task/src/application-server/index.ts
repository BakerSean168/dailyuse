/**
 * Task Application Module (Server)
 *
 * 提供 Task 模块的所有 Application Services、Use Cases 和 Event Handlers
 * 
 * 类型定义请从 @dailyuse/contracts/task 导入
 */

// ===== Container (from infrastructure-server) =====
// export { TaskContainer } from '@/infrastructure-server';

// ===== Use Cases (CQRS Commands and Queries) =====
export {
  CreateTaskTemplate,
  GetTaskTemplate,
  ListTaskTemplates,
  ActivateTaskTemplate,
  PauseTaskTemplate,
  UpdateTaskTemplate,
  ArchiveTaskTemplate,
  DeleteTaskTemplate,
  CompleteTaskInstance,
  SkipTaskInstance,
  GetTaskInstancesByDateRange,
  GetTaskInstance,
  ListTaskInstancesByAccount,
  ListTaskInstancesByTemplate,
  ListTaskInstancesByStatus,
  StartTaskInstance,
  DeleteTaskInstance,
  GetTaskDashboard
} from './services';

// ===== Query Services (Advanced Querying) =====
export { TaskQueryService } from './queries/task-query.service-api';
export { TaskQueryValidator } from './queries/task-query.validator';

// ===== Event Handlers (Domain Event Listeners) =====
export { TaskEventHandler } from './handlers/task-event.handler';
export { registerTaskEventListeners } from './handlers/register-task-event-listeners';
export { TaskReminderScheduleHandler } from './handlers/task-reminder-schedule.handler';
