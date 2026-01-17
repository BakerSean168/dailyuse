/**
 * Task Use Cases
 *
 * 单一职责的任务相关用例，按照 CQRS 模式组织
 */

// ===== Task Template Use Cases =====
export { CreateTaskTemplate } from './create-task-template';
export { GetTaskTemplate } from './get-task-template';
export { ListTaskTemplates } from './list-task-templates';
export { ActivateTaskTemplate } from './activate-task-template';
export { PauseTaskTemplate } from './pause-task-template';
export { DeleteTaskTemplate } from './delete-task-template';

// ===== Task Instance Use Cases =====
export { CompleteTaskInstance } from './complete-task-instance';
export { SkipTaskInstance } from './skip-task-instance';
export { GetTaskInstancesByDateRange } from './get-task-instances-by-date-range';

// ===== Dashboard Use Cases =====
export { GetTaskDashboard } from './get-task-dashboard';
