import type { ReminderTemplateServerDTO } from '../../aggregates/reminder-template-server';

export interface ReminderTemplateCreatedEvent {
  identityId: string;
  templateId: string;
  reminder: ReminderTemplateServerDTO;
}
