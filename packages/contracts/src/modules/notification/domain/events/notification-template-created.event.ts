import type { IdentityId, NotificationTemplateId } from '../../../../primitives';

/**
 * Notification Template Created Event
 *
 * Triggered when a new notification template aggregate is created.
 */
export interface NotificationTemplateCreatedEvent {
  identityId: IdentityId;
  templateId: NotificationTemplateId;
  name: string;
  type: string;
  category: string;
}
