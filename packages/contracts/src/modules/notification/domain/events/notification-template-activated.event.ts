import type { NotificationTemplateId } from '../../../../primitives';

/**
 * Notification Template Activated Event
 *
 * Triggered when a notification template transitions to active status.
 */
export interface NotificationTemplateActivatedEvent {
  templateId: NotificationTemplateId;
}
