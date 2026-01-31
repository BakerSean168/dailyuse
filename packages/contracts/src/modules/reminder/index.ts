/**
 * Reminder Module - Explicit Exports
 * 提醒模块 - 显式导出
 */

// ============ Constants ============
export { ROOT_GROUP_CONFIG, isRootGroup, getRootGroupUuid, isOnDesktop } from './constants';

// ============ Enums ============
export {
  ReminderType,
  TriggerType,
  ReminderStatus,
  RecurrenceType,
  WeekDay,
  ControlMode,
  NotificationChannel,
  NotificationAction,
  TriggerResult,
} from './enums';

// ============ Value Objects ============
export type {
  IRecurrenceConfigServer,
  IRecurrenceConfigClient,
  RecurrenceConfigServerDTO,
  RecurrenceConfigClientDTO,
  RecurrenceConfigPersistenceDTO,
  RecurrenceConfigServer,
  RecurrenceConfigClient,
  DailyRecurrence,
  WeeklyRecurrence,
  CustomDaysRecurrence,
} from './value-objects/recurrence-config';

export type {
  INotificationConfigServer,
  INotificationConfigClient,
  NotificationConfigServerDTO,
  NotificationConfigClientDTO,
  NotificationConfigPersistenceDTO,
  NotificationConfigServer,
  NotificationConfigClient,
  SoundConfig,
  VibrationConfig,
  NotificationActionConfig,
} from './value-objects/notification-config';

export type {
  ITriggerConfigServer,
  ITriggerConfigClient,
  TriggerConfigServerDTO,
  TriggerConfigClientDTO,
  TriggerConfigPersistenceDTO,
  TriggerConfigServer,
  TriggerConfigClient,
  FixedTimeTrigger,
  IntervalTrigger,
} from './value-objects/trigger-config';

export type {
  IActiveTimeConfigServer,
  IActiveTimeConfigClient,
  ActiveTimeConfigServerDTO,
  ActiveTimeConfigClientDTO,
  ActiveTimeConfigPersistenceDTO,
  ActiveTimeConfigServer,
  ActiveTimeConfigClient,
} from './value-objects/active-time-config';

export type {
  IActiveHoursConfigServer,
  IActiveHoursConfigClient,
  ActiveHoursConfigServerDTO,
  ActiveHoursConfigClientDTO,
  ActiveHoursConfigPersistenceDTO,
  ActiveHoursConfigServer,
  ActiveHoursConfigClient,
} from './value-objects/active-hours-config';

export type {
  IReminderStatsServer,
  IReminderStatsClient,
  ReminderStatsServerDTO,
  ReminderStatsClientDTO,
  ReminderStatsPersistenceDTO,
  ReminderStatsServer,
  ReminderStatsClient,
} from './value-objects/reminder-stats';

export type {
  IGroupStatsServer,
  IGroupStatsClient,
  GroupStatsServerDTO,
  GroupStatsClientDTO,
  GroupStatsPersistenceDTO,
  GroupStatsServer,
  GroupStatsClient,
} from './value-objects/group-stats';

export type {
  ResponseMetricsDTO,
  ResponseMetricsClientDTO,
  ResponseMetrics,
  ResponseMetricsClient,
  // Backward compatibility
  ResponseMetricsServerDTO,
  ResponseMetricsServer,
} from './value-objects/response-metrics';

export type {
  FrequencyAdjustmentDTO,
  FrequencyAdjustmentClientDTO,
  FrequencyAdjustment,
  FrequencyAdjustmentClient,
  // Backward compatibility
  FrequencyAdjustmentServerDTO,
  FrequencyAdjustmentServer,
} from './value-objects/frequency-adjustment';

// ============ Entities ============
export type {
  ReminderHistoryServerDTO,
  ReminderHistoryPersistenceDTO,
  ReminderHistoryServer,
} from './entities/reminder-history-server';

export type {
  ReminderHistoryClientDTO,
  ReminderHistoryClient,
} from './entities/reminder-history-client';

export type {
  ReminderResponseAction,
  ReminderResponseServerDTO,
  ReminderResponseClientDTO,
  ReminderResponsePersistenceDTO,
  ReminderResponseServer,
} from './entities/reminder-response-server';

// ============ Aggregates ============
export type {
  ReminderTemplateServerDTO,
  ReminderTemplatePersistenceDTO,
  ReminderTemplateCreatedEvent,
  ReminderTemplateUpdatedEvent,
  ReminderTemplateDeletedEvent,
  ReminderTemplateEnabledEvent,
  ReminderTemplatePausedEvent,
  ReminderTemplateTriggeredEvent,
  ReminderTemplateMovedEvent,
  ReminderTemplateDomainEvent,
  ReminderTemplateServer,
} from './aggregates/reminder-template-server';

export type {
  ReminderTemplateClientDTO,
  ReminderTemplateClient,
} from './aggregates/reminder-template-client';

export type {
  ReminderGroupServerDTO,
  ReminderGroupPersistenceDTO,
  ReminderGroupCreatedEvent,
  ReminderGroupUpdatedEvent,
  ReminderGroupDeletedEvent,
  ReminderGroupControlModeSwitchedEvent,
  ReminderGroupEnabledEvent,
  ReminderGroupPausedEvent,
  ReminderGroupDomainEvent,
  ReminderGroupServer,
} from './aggregates/reminder-group-server';

export type {
  ReminderGroupClientDTO,
  ReminderGroupClient,
} from './aggregates/reminder-group-client';

export type {
  ReminderStatisticsServerDTO,
  ReminderStatisticsPersistenceDTO,
  ReminderStatisticsUpdatedEvent,
  ReminderStatisticsDomainEvent,
  ReminderStatisticsServer,
  TemplateStatsInfo,
  GroupStatsInfo,
  TriggerStatsInfo,
} from './aggregates/reminder-statistics-server';

export type {
  ReminderStatisticsClientDTO,
  ReminderStatisticsClient,
} from './aggregates/reminder-statistics-client';

export type {
  TimeSlotDTO,
  UserReminderPreferencesServerDTO,
  UserReminderPreferencesClientDTO,
  UserReminderPreferencesPersistenceDTO,
  UserReminderPreferencesServer,
} from './aggregates/user-reminder-preferences-server';

// ============ API Requests ============
export type {
  CreateReminderTemplateRequest,
  UpdateReminderTemplateRequest,
  QueryReminderTemplatesRequest,
  ReminderTemplateDTO,
  ReminderTemplateListDTO,
  CreateReminderGroupRequest,
  UpdateReminderGroupRequest,
  SwitchGroupControlModeRequest,
  BatchGroupTemplatesRequest,
  ReminderGroupDTO,
  ReminderGroupListDTO,
  ReminderHistoryDTO,
  ReminderHistoryListDTO,
  ReminderStatisticsDTO,
  ReminderOperationResponseDTO,
  ReminderTriggerResponseDTO,
  BatchOperationResponseDTO,
  TemplateScheduleStatusDTO,
  UpcomingReminderItemDTO,
  GetUpcomingRemindersRequest,
  UpcomingRemindersResponseDTO,
} from './api-requests';
