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

// ============ Value Objects ============
export type {
  INotificationAction,
  INotificationActionClient,
  NotificationActionDTO,
  NotificationActionClientDTO,
  NotificationActionPersistenceDTO,
  NotificationAction,
  NotificationActionClient,
  // Backward compatibility
  INotificationActionServer,
  NotificationActionServerDTO,
  NotificationActionServer,
} from './value-objects/notification-action';

export type {
  INotificationMetadata,
  INotificationMetadataClient,
  NotificationMetadataDTO,
  NotificationMetadataClientDTO,
  NotificationMetadataPersistenceDTO,
  NotificationMetadata,
  NotificationMetadataClient,
  // Backward compatibility
  INotificationMetadataServer,
  NotificationMetadataServerDTO,
  NotificationMetadataServer,
} from './value-objects/notification-metadata';

export type {
  ChannelPreference,
  ICategoryPreference,
  ICategoryPreferenceClient,
  CategoryPreferenceDTO,
  CategoryPreferenceClientDTO,
  CategoryPreferencePersistenceDTO,
  CategoryPreference,
  CategoryPreferenceClient,
  // Backward compatibility
  ICategoryPreferenceServer,
  CategoryPreferenceServerDTO,
  CategoryPreferenceServer,
} from './value-objects/category-preference';

export type {
  IDoNotDisturbConfig,
  IDoNotDisturbConfigClient,
  DoNotDisturbConfigDTO,
  DoNotDisturbConfigClientDTO,
  DoNotDisturbConfigPersistenceDTO,
  DoNotDisturbConfig,
  DoNotDisturbConfigClient,
  // Backward compatibility
  IDoNotDisturbConfigServer,
  DoNotDisturbConfigServerDTO,
  DoNotDisturbConfigServer,
} from './value-objects/do-not-disturb-config';

export type {
  IRateLimit,
  IRateLimitClient,
  RateLimitDTO,
  RateLimitClientDTO,
  RateLimitPersistenceDTO,
  RateLimit,
  RateLimitClient,
  // Backward compatibility
  IRateLimitServer,
  RateLimitServerDTO,
  RateLimitServer,
} from './value-objects/rate-limit';

export type {
  IChannelError,
  IChannelErrorClient,
  ChannelErrorDTO,
  ChannelErrorClientDTO,
  ChannelErrorPersistenceDTO,
  ChannelError,
  ChannelErrorClient,
  // Backward compatibility
  IChannelErrorServer,
  ChannelErrorServerDTO,
  ChannelErrorServer,
} from './value-objects/channel-error';

export type {
  IChannelResponse,
  IChannelResponseClient,
  ChannelResponseDTO,
  ChannelResponseClientDTO,
  ChannelResponsePersistenceDTO,
  ChannelResponse,
  ChannelResponseClient,
  // Backward compatibility
  IChannelResponseServer,
  ChannelResponseServerDTO,
  ChannelResponseServer,
} from './value-objects/channel-response';

export type {
  TemplateContent,
  EmailTemplateContent,
  PushTemplateContent,
  ChannelConfig,
  INotificationTemplateConfig,
  INotificationTemplateConfigClient,
  NotificationTemplateConfigDTO,
  NotificationTemplateConfigClientDTO,
  NotificationTemplateConfigPersistenceDTO,
  NotificationTemplateConfig,
  NotificationTemplateConfigClient,
  // Backward compatibility
  INotificationTemplateConfigServer,
  NotificationTemplateConfigServerDTO,
  NotificationTemplateConfigServer,
} from './value-objects/notification-template-vo';

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
