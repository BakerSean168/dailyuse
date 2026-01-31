/**
 * Notification Value Objects
 * 通知值对象导出
 */

// ============ Server 端值对象 ============
export type {
  INotificationActionServer,
  NotificationActionServerDTO,
  NotificationActionPersistenceDTO,
  NotificationActionServer,
} from './notification-action-server';

export type {
  INotificationMetadataServer,
  NotificationMetadataServerDTO,
  NotificationMetadataPersistenceDTO,
  NotificationMetadataServer,
} from './notification-metadata-server';

export type {
  ChannelPreference,
  ICategoryPreferenceServer,
  CategoryPreferenceServerDTO,
  CategoryPreferencePersistenceDTO,
  CategoryPreferenceServer,
} from './category-preference-server';

export type {
  IDoNotDisturbConfigServer,
  DoNotDisturbConfigServerDTO,
  DoNotDisturbConfigPersistenceDTO,
  DoNotDisturbConfigServer,
} from './do-not-disturb-config-server';

export type {
  IRateLimitServer,
  RateLimitServerDTO,
  RateLimitPersistenceDTO,
  RateLimitServer,
} from './rate-limit-server';

export type {
  IChannelErrorServer,
  ChannelErrorServerDTO,
  ChannelErrorPersistenceDTO,
  ChannelErrorServer,
} from './channel-error-server';

export type {
  IChannelResponseServer,
  ChannelResponseServerDTO,
  ChannelResponsePersistenceDTO,
  ChannelResponseServer,
} from './channel-response-server';

export type {
  TemplateContent,
  EmailTemplateContent,
  PushTemplateContent,
  ChannelConfig,
  INotificationTemplateConfigServer,
  NotificationTemplateConfigServerDTO,
  NotificationTemplateConfigPersistenceDTO,
  NotificationTemplateConfigServer,
} from './notification-template-vo-server';

// ============ Client 端值对象 ============
export type {
  INotificationActionClient,
  NotificationActionClientDTO,
  NotificationActionClient,
} from './notification-action-client';

export type {
  INotificationMetadataClient,
  NotificationMetadataClientDTO,
  NotificationMetadataClient,
} from './notification-metadata-client';

export type {
  ICategoryPreferenceClient,
  CategoryPreferenceClientDTO,
  CategoryPreferenceClient,
} from './category-preference-client';

export type {
  IDoNotDisturbConfigClient,
  DoNotDisturbConfigClientDTO,
  DoNotDisturbConfigClient,
} from './do-not-disturb-config-client';

export type {
  IRateLimitClient,
  RateLimitClientDTO,
  RateLimitClient,
} from './rate-limit-client';

export type {
  IChannelErrorClient,
  ChannelErrorClientDTO,
  ChannelErrorClient,
} from './channel-error-client';

export type {
  IChannelResponseClient,
  ChannelResponseClientDTO,
  ChannelResponseClient,
} from './channel-response-client';

export type {
  INotificationTemplateConfigClient,
  NotificationTemplateConfigClientDTO,
  NotificationTemplateConfigClient,
} from './notification-template-vo-client';

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
