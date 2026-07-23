/**
 * Reminder Value Objects
 * 提醒值对象导出
 */

// ============ Enum Value Objects ============
export { ReminderType } from './reminder-type';
export { ReminderStatus } from './reminder-status';
export { TriggerType } from './trigger-type';
export { ControlMode } from './control-mode';
export { NotificationChannel } from './notification-channel';
export { NotificationAction } from './notification-action';
export { TriggerResult } from './trigger-result';

export type {
  SoundConfig,
  VibrationConfig,
  NotificationActionConfig,
  INotificationConfig,
  NotificationConfigDTO,
} from './notification-config';

export type {
  FixedTimeTrigger,
  IntervalTrigger,
  ITriggerConfig,
  TriggerConfigDTO,
} from './trigger-config';

export type {
  IActiveTimeConfig,
  ActiveTimeConfigDTO,
} from './active-time-config';

export { ActiveHoursConfigSchema } from './active-hours-config';
export type {
  IActiveHoursConfig,
  ActiveHoursConfigDTO,
} from './active-hours-config';

export { GroupStatsSchema } from './group-stats';
export type {
  IGroupStats,
  GroupStatsDTO,
} from './group-stats';

export type {
  ResponseMetricsDTO,
  ResponseMetrics,
} from './response-metrics';

export type {
  FrequencyAdjustmentDTO,
  FrequencyAdjustment,
} from './frequency-adjustment';
