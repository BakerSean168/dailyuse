/**
 * Task Value Objects Export
 */

// RecurrenceRule
export type {
  RecurrenceRule,
  RecurrenceRuleDTO,
} from './recurrence-rule';

// TaskReminderConfig
export type {
  TaskReminderConfig,
  TaskReminderConfigDTO,
} from './task-reminder-config';
export { TaskReminderConfigSchema } from './task-reminder-config';


// TaskGoalBinding
export type {
  TaskGoalBinding,
  TaskGoalBindingDTO,
} from './task-goal-binding';
export { TaskGoalBindingSchema } from './task-goal-binding';
export { TaskGoalBindingTrigger } from './task-goal-binding-trigger';
export type { TaskGoalBindingTrigger as TaskGoalBindingTriggerValue } from './task-goal-binding-trigger';

// TaskTimeConfig
export type {
  TaskTimeConfig,
  TaskTimeConfigDTO,
} from './task-time-config';

// CompletionRecord
export type {
  CompletionRecord,
  CompletionRecordDTO,
} from './completion-record';

// Enums
export { RecurrenceFrequency } from './recurrence-frequency';
export { DayOfWeek } from './day-of-week';
export { TaskReminderType } from './task-reminder-type';
export { ReminderTimeUnit } from './reminder-time-unit';
export { DependencyType } from './dependency-type';
export { DependencyStatus } from './dependency-status';
export { RecurrenceEndConditionType } from './recurrence-end-condition-type';
export { TaskScheduleMode } from './task-schedule-mode';

export { TaskTemplateStatus } from './task-template-status';
export { TaskInstanceStatus } from './task-instance-status';
export { TaskTimeType } from './task-time-type';
export { TaskType } from './task-type';
export type { ChecklistItemDefinition, ChecklistItemDefinitionDTO } from './checklist-item-definition';
