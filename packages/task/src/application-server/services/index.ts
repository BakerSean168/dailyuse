/**
 * Task Application Services Index
 *
 * 导出所有 Task 模块的 Application Services
 * 包含 Use Cases (CQRS Commands/Queries) 和 Complex Application Services
 * 
 * 类型定义请从 @dailyuse/contracts/task 导入
 */

// ===== Use Cases (Single Purpose) =====
export { CreateTaskTemplate } from './create-task-template';
export { GetTaskTemplate } from './get-task-template';
export { ListTaskTemplates } from './list-task-templates';
export { ActivateTaskTemplate } from './activate-task-template';
export { PauseTaskTemplate } from './pause-task-template';
export { DeleteTaskTemplate } from './delete-task-template';
export { CompleteTaskInstance } from './complete-task-instance';
export { SkipTaskInstance } from './skip-task-instance';
export { GetTaskInstancesByDateRange } from './get-task-instances-by-date-range';
export { GetTaskDashboard } from './get-task-dashboard';

// ===== Application Services (Complex Orchestration) =====
export { TaskInstanceApplicationService } from './task-instance-application-service';
export { TaskTemplateApplicationService } from './task-template-application-service';
export { TaskDependencyApplicationService } from './task-dependency-application-service';
