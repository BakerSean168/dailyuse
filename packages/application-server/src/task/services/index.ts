/**
 * Task Services Index
 *
 * 导出所有 Task 模块的 Use Case
 * 
 * 类型定义请从 @dailyuse/contracts/task 导入
 */

// ===== Task Template Services =====
export { CreateTaskTemplate } from './create-task-template';
export { GetTaskTemplate } from './get-task-template';
export { ListTaskTemplates } from './list-task-templates';
export { ActivateTaskTemplate } from './activate-task-template';
export { PauseTaskTemplate } from './pause-task-template';
export { DeleteTaskTemplate } from './delete-task-template';

// ===== Task Instance Services =====
export { CompleteTaskInstance } from './complete-task-instance';
export { SkipTaskInstance } from './skip-task-instance';
export { GetTaskInstancesByDateRange } from './get-task-instances-by-date-range';

// ===== Dashboard Services =====
export { GetTaskDashboard } from './get-task-dashboard';

// ===== Query Services (with Priority Calculation) =====
export { 
  TaskQueryService,
  enrichWithPriority,
  enrichMultipleWithPriority,
  extractDueDate,
} from './task-query.service';
