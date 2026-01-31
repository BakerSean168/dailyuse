/**
 * Notification Module - Explicit Exports
 * 通知模块 - 显式导出
 *
 * ImportanceLevel 和 UrgencyLevel 从 @dailyuse/contracts/shared 导入
 */

// ============ Enums ============
export {
  NotificationType,
  NotificationCategory,
  NotificationStatus,
  RelatedEntityType,
  NotificationChannelType,
  ChannelStatus,
  NotificationActionType,
  ContentType,
} from './enums';

// ============ Value Objects - Server ============
export type {
  INotificationActionServer,
  NotificationActionServerDTO,
  NotificationActionPersistenceDTO,
  NotificationActionServer,
} from './value-objects/notification-action-server';

export type {
  INotificationMetadataServer,
  NotificationMetadataServerDTO,
  NotificationMetadataPersistenceDTO,
  NotificationMetadataServer,
} from './value-objects/notification-metadata-server';

export type {
  ICategoryPreferenceServer,
  CategoryPreferenceServerDTO,
  CategoryPreferencePersistenceDTO,
  CategoryPreferenceServer,
  ChannelPreference,
} from './value-objects/category-preference-server';

export type {
  IDoNotDisturbConfigServer,
  DoNotDisturbConfigServerDTO,
  DoNotDisturbConfigPersistenceDTO,
  DoNotDisturbConfigServer,
} from './value-objects/do-not-disturb-config-server';

export type {
  IDoNotDisturbConfigClient,
  DoNotDisturbConfigClientDTO,
  DoNotDisturbConfigClient,
} from './value-objects/do-not-disturb-config-client';

export type {
  IRateLimitServer,
  RateLimitServerDTO,
  RateLimitPersistenceDTO,
  RateLimitServer,
} from './value-objects/rate-limit-server';

export type {
  IChannelErrorServer,
  ChannelErrorServerDTO,
  ChannelErrorPersistenceDTO,
  ChannelErrorServer,
} from './value-objects/channel-error-server';

export type {
  IChannelResponseServer,
  ChannelResponseServerDTO,
  ChannelResponsePersistenceDTO,
  ChannelResponseServer,
} from './value-objects/channel-response-server';

export type {
  INotificationTemplateConfigServer,
  NotificationTemplateConfigServerDTO,
  NotificationTemplateConfigPersistenceDTO,
  NotificationTemplateConfigServer,
  TemplateContent,
  EmailTemplateContent,
  PushTemplateContent,
  ChannelConfig,
} from './value-objects/notification-template-vo-server';

// ============ Value Objects - Client ============
export type {
  INotificationActionClient,
  NotificationActionClientDTO,
  NotificationActionClient,
} from './value-objects/notification-action-client';

export type {
  INotificationMetadataClient,
  NotificationMetadataClientDTO,
  NotificationMetadataClient,
} from './value-objects/notification-metadata-client';

export type {
  ICategoryPreferenceClient,
  CategoryPreferenceClientDTO,
  CategoryPreferenceClient,
} from './value-objects/category-preference-client';

export type {
  IRateLimitClient,
  RateLimitClientDTO,
  RateLimitClient,
} from './value-objects/rate-limit-client';

export type {
  IChannelErrorClient,
  ChannelErrorClientDTO,
  ChannelErrorClient,
} from './value-objects/channel-error-client';

export type {
  IChannelResponseClient,
  ChannelResponseClientDTO,
  ChannelResponseClient,
} from './value-objects/channel-response-client';

export type {
  INotificationTemplateConfigClient,
  NotificationTemplateConfigClientDTO,
  NotificationTemplateConfigClient,
} from './value-objects/notification-template-vo-client';

// ============ Aggregates ============
export type {
  NotificationServerDTO,
  NotificationPersistenceDTO,
  NotificationCreatedEvent,
  NotificationSentEvent,
  NotificationReadEvent,
  NotificationDeletedEvent,
  NotificationStatusChangedEvent,
  NotificationDomainEvent,
  NotificationServer,
} from './aggregates/notification-server';

export type {
  NotificationClientDTO,
  NotificationClient,
} from './aggregates/notification-client';

export type {
  NotificationTemplateAggregateServerDTO,
  NotificationTemplateAggregatePersistenceDTO,
  NotificationTemplateCreatedEvent,
  NotificationTemplateUpdatedEvent,
  NotificationTemplateActivationChangedEvent,
  NotificationTemplateDomainEvent,
  NotificationTemplateServer,
} from './aggregates/notification-template-server';

export type {
  NotificationTemplateAggregateClientDTO,
  NotificationTemplateClient,
} from './aggregates/notification-template-client';

export type {
  NotificationPreferenceServerDTO,
  NotificationPreferencePersistenceDTO,
  NotificationPreferenceCreatedEvent,
  NotificationPreferenceUpdatedEvent,
  NotificationPreferenceDomainEvent,
  NotificationPreferenceServer,
  ChannelPreferences,
  CategoryPreferences,
} from './aggregates/notification-preference-server';

export type {
  NotificationPreferenceClientDTO,
  NotificationPreferenceClient,
} from './aggregates/notification-preference-client';

// ============ Entities ============
export type {
  NotificationChannelServerDTO,
  NotificationChannelPersistenceDTO,
  NotificationChannelServer,
} from './entities/notification-channel-server';

export type {
  NotificationChannelClientDTO,
  NotificationChannelClient,
} from './entities/notification-channel-client';

export type {
  NotificationHistoryServerDTO,
  NotificationHistoryPersistenceDTO,
  NotificationHistoryServer,
} from './entities/notification-history-server';

export type {
  NotificationHistoryClientDTO,
  NotificationHistoryClient,
} from './entities/notification-history-client';

// ============ API Requests ============
export type {
  NotificationDTO,
  NotificationListResponseDTO,
  NotificationStatsResponseDTO,
  NotificationChannelDTO,
  NotificationChannelListResponseDTO,
  NotificationTemplateDTO,
  NotificationTemplateListResponseDTO,
  NotificationPreferenceDTO,
  TemplateRenderResultDTO,
  TemplateValidationResultDTO,
  CreateNotificationRequest,
  UpdateNotificationRequest,
  NotificationQueryParamsDTO,
  MarkAsReadBatchRequest,
  DeleteNotificationsBatchRequest,
  CleanupOldNotificationsRequest,
  CreateNotificationTemplateRequest,
  UpdateNotificationTemplateRequest,
  CreateNotificationFromTemplateRequest,
  RenderTemplateRequest,
  UpdateNotificationPreferenceRequest,
  SendNotificationRequest,
  RetryChannelRequest,
  ExecuteNotificationActionRequest,
} from './api-requests';
