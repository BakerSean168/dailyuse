/**
 * Task Value Objects
 * 任务值对象导出
 */

// IDs
export { TaskTemplateId } from './task-template-id';
export { TaskInstanceId } from './task-instance-id';
export { TaskDependencyId } from './task-dependency-id';
export { TaskFolderId } from './task-folder-id';
export { SubtaskId } from './subtask-id';

// Type Value Objects (Enums)
export { TaskTemplateStatus } from './task-template-status';
export { TaskInstanceStatus } from './task-instance-status';
export { TaskTimeType } from './task-time-type';
export { TaskGoalBindingTrigger } from '@dailyuse/contracts/task';

// Class Value Objects
export { RecurrenceRule } from './recurrence-rule';
export { TaskReminderConfig } from './task-reminder-config';
export { TaskGoalBinding } from './task-goal-binding';
export { TaskTimeConfig } from './task-time-config';
export { CompletionRecord } from './completion-record';
export { ChecklistItemDefinition } from './checklist-item-definition';
