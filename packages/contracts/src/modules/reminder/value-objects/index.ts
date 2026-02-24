/**
 * Reminder Value Objects
 * 提醒值对象导出
 */

// ============ Enum Value Objects ============
export { ReminderType } from './reminder-type';
export { ReminderStatus } from './reminder-status';
export { TriggerType } from './trigger-type';
export { RecurrenceType } from './recurrence-type';
export { WeekDay } from './week-day';
export { ControlMode } from './control-mode';
export { NotificationChannel } from './notification-channel';
export { NotificationAction } from './notification-action';
export { TriggerResult } from './trigger-result';

// ============ Complex Value Objects ============
export type {
  DailyRecurrence,
  WeeklyRecurrence,
  CustomDaysRecurrence,
  IRecurrenceConfigServer,
  IRecurrenceConfigClient,
  RecurrenceConfigServerDTO,
  RecurrenceConfigClientDTO,
  RecurrenceConfigPersistenceDTO,
  RecurrenceConfigServer,
  RecurrenceConfigClient,
} from './recurrence-config';

export type {
  SoundConfig,
  VibrationConfig,
  NotificationActionConfig,
  INotificationConfigServer,
  INotificationConfigClient,
  NotificationConfigServerDTO,
  NotificationConfigClientDTO,
  NotificationConfigPersistenceDTO,
  NotificationConfigServer,
  NotificationConfigClient,
} from './notification-config';

export type {
  FixedTimeTrigger,
  IntervalTrigger,
  ITriggerConfigServer,
  ITriggerConfigClient,
  TriggerConfigServerDTO,
  TriggerConfigClientDTO,
  TriggerConfigPersistenceDTO,
  TriggerConfigServer,
  TriggerConfigClient,
} from './trigger-config';

export type {
  IActiveTimeConfigServer,
  IActiveTimeConfigClient,
  ActiveTimeConfigServerDTO,
  ActiveTimeConfigClientDTO,
  ActiveTimeConfigPersistenceDTO,
  ActiveTimeConfigServer,
  ActiveTimeConfigClient,
} from './active-time-config';

export type {
  IActiveHoursConfigServer,
  IActiveHoursConfigClient,
  ActiveHoursConfigServerDTO,
  ActiveHoursConfigClientDTO,
  ActiveHoursConfigPersistenceDTO,
  ActiveHoursConfigServer,
  ActiveHoursConfigClient,
} from './active-hours-config';

export type {
  IGroupStatsServer,
  IGroupStatsClient,
  GroupStatsServerDTO,
  GroupStatsClientDTO,
  GroupStatsPersistenceDTO,
  GroupStatsServer,
  GroupStatsClient,
} from './group-stats';

export type {
  ResponseMetricsDTO,
  ResponseMetricsClientDTO,
  ResponseMetrics,
  ResponseMetricsClient,
} from './response-metrics';

export type {
  FrequencyAdjustmentDTO,
  FrequencyAdjustmentClientDTO,
  FrequencyAdjustment,
  FrequencyAdjustmentClient,
} from './frequency-adjustment';
