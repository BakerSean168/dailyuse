/**
 * Reminder Value Objects
 * 提醒值对象导出
 */

// IDs
export { ReminderTemplateId } from './reminder-template-id';
export { ReminderGroupId } from './reminder-group-id';
export { ReminderInstanceId } from './reminder-instance-id';
export { ReminderHistoryId } from './reminder-history-id';
export { ReminderResponseId } from './reminder-response-id';

// Enum-like Value Objects
export { ReminderType } from './reminder-type';
export { ReminderStatus } from './reminder-status';
export { TriggerType } from './trigger-type';
export { RecurrenceType } from './recurrence-type';
export { WeekDay } from './week-day';
export { ControlMode } from './control-mode';
export { NotificationChannel as ReminderNotificationChannel } from './notification-channel';
// 重命名以避免与 notification 模块的 NotificationAction 冲突
export { NotificationAction as ReminderResponseAction } from './notification-action';
export { TriggerResult } from './trigger-result';

// Class-type Value Objects
export { RecurrenceConfig } from './recurrence-config';
export { ReminderNotificationConfig } from './reminder-notification-config';
export { TriggerConfig } from './trigger-config';
export { ActiveTimeConfig } from './active-time-config';
export { ActiveHoursConfig } from './active-hours-config';
export { GroupStats } from './group-stats';
export { ResponseMetrics } from './response-metrics';
export { FrequencyAdjustment } from './frequency-adjustment';
