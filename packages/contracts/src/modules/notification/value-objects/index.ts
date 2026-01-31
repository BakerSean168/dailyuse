/**
 * Notification Value Objects
 * 通知值对象导出
 */

// ============ NotificationAction ============
export type {
  INotificationAction,
  INotificationActionClient,
  NotificationActionDTO,
  NotificationActionClientDTO,
  NotificationActionPersistenceDTO,
  NotificationAction,
  NotificationActionClient,
  // Backward compatibility
  NotificationActionServerDTO,
  INotificationActionServer,
  NotificationActionServer,
} from './notification-action';

// ============ NotificationMetadata ============
export type {
  INotificationMetadata,
  INotificationMetadataClient,
  NotificationMetadataDTO,
  NotificationMetadataClientDTO,
  NotificationMetadataPersistenceDTO,
  NotificationMetadata,
  NotificationMetadataClient,
  // Backward compatibility
  NotificationMetadataServerDTO,
  INotificationMetadataServer,
  NotificationMetadataServer,
} from './notification-metadata';

// ============ CategoryPreference ============
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
  CategoryPreferenceServerDTO,
  ICategoryPreferenceServer,
  CategoryPreferenceServer,
} from './category-preference';

// ============ DoNotDisturbConfig ============
export type {
  IDoNotDisturbConfig,
  IDoNotDisturbConfigClient,
  DoNotDisturbConfigDTO,
  DoNotDisturbConfigClientDTO,
  DoNotDisturbConfigPersistenceDTO,
  DoNotDisturbConfig,
  DoNotDisturbConfigClient,
  // Backward compatibility
  DoNotDisturbConfigServerDTO,
  IDoNotDisturbConfigServer,
  DoNotDisturbConfigServer,
} from './do-not-disturb-config';

// ============ RateLimit ============
export type {
  IRateLimit,
  IRateLimitClient,
  RateLimitDTO,
  RateLimitClientDTO,
  RateLimitPersistenceDTO,
  RateLimit,
  RateLimitClient,
  // Backward compatibility
  RateLimitServerDTO,
  IRateLimitServer,
  RateLimitServer,
} from './rate-limit';

// ============ ChannelError ============
export type {
  IChannelError,
  IChannelErrorClient,
  ChannelErrorDTO,
  ChannelErrorClientDTO,
  ChannelErrorPersistenceDTO,
  ChannelError,
  ChannelErrorClient,
  // Backward compatibility
  ChannelErrorServerDTO,
  IChannelErrorServer,
  ChannelErrorServer,
} from './channel-error';

// ============ ChannelResponse ============
export type {
  IChannelResponse,
  IChannelResponseClient,
  ChannelResponseDTO,
  ChannelResponseClientDTO,
  ChannelResponsePersistenceDTO,
  ChannelResponse,
  ChannelResponseClient,
  // Backward compatibility
  ChannelResponseServerDTO,
  IChannelResponseServer,
  ChannelResponseServer,
} from './channel-response';

// ============ NotificationTemplateConfig ============
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
  NotificationTemplateConfigServerDTO,
  INotificationTemplateConfigServer,
  NotificationTemplateConfigServer,
} from './notification-template-vo';

// ============ 共享枚举/类型 ============
export { ChannelStatus } from './channel-status';
export type { ChannelStatus as ChannelStatusType } from './channel-status';

export { ContentType } from './content-type';
export type { ContentType as ContentTypeType } from './content-type';

export { NotificationActionType } from './notification-action-type';
export type { NotificationActionType as NotificationActionTypeType } from './notification-action-type';

export { NotificationCategory } from './notification-category';
export type { NotificationCategory as NotificationCategoryType } from './notification-category';

export { NotificationChannelType } from './notification-channel-type';
export type { NotificationChannelType as NotificationChannelTypeEnumType } from './notification-channel-type';

export { NotificationStatus } from './notification-status';
export type { NotificationStatus as NotificationStatusType } from './notification-status';

export { NotificationType } from './notification-type';
export type { NotificationType as NotificationTypeType } from './notification-type';

export { RelatedEntityType } from './related-entity-type';
export type { RelatedEntityType as RelatedEntityTypeType } from './related-entity-type';
