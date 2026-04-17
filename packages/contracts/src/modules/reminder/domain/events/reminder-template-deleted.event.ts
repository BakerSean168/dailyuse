import type { ReminderTemplateServerDTO } from '../../aggregates/reminder-template-server';

export interface ReminderTemplateDeletedEvent {
  identityId: string;
  templateId: string;
  templateTitle: string;
  reminder: ReminderTemplateServerDTO;
  isSoftDelete: boolean;
  deletedAt: number;
}
