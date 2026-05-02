/**
 * Notification Template Updated Event
 *
 * Triggered when an existing notification template is modified.
 */
export interface NotificationTemplateUpdatedEvent {
  templateId: string;
  changedFields: string[];
}
