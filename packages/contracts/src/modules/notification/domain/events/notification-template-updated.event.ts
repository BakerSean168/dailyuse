import type { NotificationTemplateId } from '../../../../primitives';

/**
 * Notification Template Updated Event
 *
 * Triggered when an existing notification template is modified.
 */
export interface NotificationTemplateUpdatedEvent {
  templateId: NotificationTemplateId;
  changedFields: string[];
}
