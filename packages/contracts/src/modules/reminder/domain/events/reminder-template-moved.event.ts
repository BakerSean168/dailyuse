import type { ReminderTemplateServerDTO } from '../../aggregates/reminder-template-server';

export interface ReminderTemplateMovedEvent {
  identityId: string;
  templateId: string;
  oldGroupId: string | null;
  newGroupId: string | null;
  reminder: ReminderTemplateServerDTO;
}
