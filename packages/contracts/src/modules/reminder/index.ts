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
} from './value-objects/RecurrenceConfig';

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
} from './value-objects/NotificationConfig';

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
} from './value-objects/TriggerConfig';

export type {
  IActiveTimeConfigServer,
  IActiveTimeConfigClient,
  ActiveTimeConfigServerDTO,
  ActiveTimeConfigClientDTO,
  ActiveTimeConfigPersistenceDTO,
  ActiveTimeConfigServer,
  ActiveTimeConfigClient,
} from './value-objects/ActiveTimeConfig';

export type {
  IActiveHoursConfigServer,
  IActiveHoursConfigClient,
  ActiveHoursConfigServerDTO,
  ActiveHoursConfigClientDTO,
  ActiveHoursConfigPersistenceDTO,
  ActiveHoursConfigServer,
  ActiveHoursConfigClient,
} from './value-objects/ActiveHoursConfig';

export type {
  IReminderStatsServer,
  IReminderStatsClient,
  ReminderStatsServerDTO,
  ReminderStatsClientDTO,
  ReminderStatsPersistenceDTO,
  ReminderStatsServer,
  ReminderStatsClient,
} from './value-objects/ReminderStats';

export type {
  IGroupStatsServer,
  IGroupStatsClient,
  GroupStatsServerDTO,
  GroupStatsClientDTO,
  GroupStatsPersistenceDTO,
  GroupStatsServer,
  GroupStatsClient,
} from './value-objects/GroupStats';

export type {
  ResponseMetricsServerDTO,
  ResponseMetricsClientDTO,
  ResponseMetricsServer,
  ResponseMetricsServerStatic,
} from './value-objects/ResponseMetricsServer';

export type {
  FrequencyAdjustmentServerDTO,
  FrequencyAdjustmentClientDTO,
  FrequencyAdjustmentServer,
  FrequencyAdjustmentServerStatic,
} from './value-objects/FrequencyAdjustmentServer';

// ============ Entities ============
export type {
  ReminderHistoryServerDTO,
  ReminderHistoryPersistenceDTO,
  ReminderHistoryServer,
  ReminderHistoryServerStatic,
} from './entities/ReminderHistoryServer';

export type {
  ReminderHistoryClientDTO,
  ReminderHistoryClient,
  ReminderHistoryClientStatic,
} from './entities/ReminderHistoryClient';

export type {
  ReminderResponseAction,
  ReminderResponseServerDTO,
  ReminderResponseClientDTO,
  ReminderResponsePersistenceDTO,
  ReminderResponseServer,
  ReminderResponseServerStatic,
} from './entities/ReminderResponseServer';

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
  ReminderTemplateServerStatic,
} from './aggregates/ReminderTemplateServer';

export type {
  ReminderTemplateClientDTO,
  ReminderTemplateClient,
  ReminderTemplateClientStatic,
} from './aggregates/ReminderTemplateClient';

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
  ReminderGroupServerStatic,
} from './aggregates/ReminderGroupServer';

export type {
  ReminderGroupClientDTO,
  ReminderGroupClient,
  ReminderGroupClientStatic,
} from './aggregates/ReminderGroupClient';

export type {
  ReminderStatisticsServerDTO,
  ReminderStatisticsPersistenceDTO,
  ReminderStatisticsUpdatedEvent,
  ReminderStatisticsDomainEvent,
  ReminderStatisticsServer,
  ReminderStatisticsServerStatic,
  TemplateStatsInfo,
  GroupStatsInfo,
  TriggerStatsInfo,
} from './aggregates/ReminderStatisticsServer';

export type {
  ReminderStatisticsClientDTO,
  ReminderStatisticsClient,
  ReminderStatisticsClientStatic,
} from './aggregates/ReminderStatisticsClient';

export type {
  TimeSlotDTO,
  UserReminderPreferencesServerDTO,
  UserReminderPreferencesClientDTO,
  UserReminderPreferencesPersistenceDTO,
  UserReminderPreferencesServer,
  UserReminderPreferencesServerStatic,
} from './aggregates/UserReminderPreferencesServer';

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
