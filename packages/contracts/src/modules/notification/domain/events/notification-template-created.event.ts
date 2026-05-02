/**
 * Notification Template Created Event
 *
 * Triggered when a new notification template aggregate is created.
 */
export interface NotificationTemplateCreatedEvent {
  identityId: string;
  name: string;
  type: string;
  category: string;
}
