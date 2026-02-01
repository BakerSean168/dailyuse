/**
 * Notification Value Objects
 * 通知值对象导出
 */

// ============ NotificationAction ============
export type {
  NotificationAction,
  NotificationActionDTO,
  NotificationActionPersistenceDTO,
} from './notification-action';

// ============ NotificationMetadata ============
export type {
  NotificationMetadata,
  NotificationMetadataDTO,
  NotificationMetadataPersistenceDTO,
} from './notification-metadata';

// ============ CategoryPreference ============
export type {
  ChannelPreference,
  CategoryPreference,
  CategoryPreferenceDTO,
  CategoryPreferencePersistenceDTO,
} from './category-preference';

// ============ DoNotDisturbConfig ============
export type {
  DoNotDisturbConfig,
  DoNotDisturbConfigDTO,
  DoNotDisturbConfigPersistenceDTO,
} from './do-not-disturb-config';

// ============ RateLimit ============
export type {
  RateLimit,
  RateLimitDTO,
  RateLimitPersistenceDTO,
} from './rate-limit';

// ============ ChannelError ============
export type {
  ChannelError,
  ChannelErrorDTO,
  ChannelErrorPersistenceDTO,
} from './channel-error';

// ============ ChannelResponse ============
export type {
  ChannelResponse,
  ChannelResponseDTO,
  ChannelResponsePersistenceDTO,
} from './channel-response';

// ============ Enum Value Objects ============
export { NotificationType } from './notification-type';

export { NotificationCategory } from './notification-category';

export { NotificationStatus } from './notification-status';

export { RelatedEntityType } from './related-entity-type';

export { NotificationChannelType } from './notification-channel-type';

export { ChannelStatus } from './channel-status';

export { NotificationActionType } from './notification-action-type';

export { ContentType } from './content-type';


export type { NotificationTemplateDTO } from './notification-template';
export type { SnoozeSessionDTO } from './snooze-session';