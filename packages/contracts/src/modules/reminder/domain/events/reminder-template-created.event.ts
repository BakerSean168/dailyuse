import type { ReminderTemplateServerDTO } from '../../aggregates';

export interface ReminderTemplateCreatedEvent {
  identityId: string;
  templateId: string;
  reminder: ReminderTemplateServerDTO;
}
