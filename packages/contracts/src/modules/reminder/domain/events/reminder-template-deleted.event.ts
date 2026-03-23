import type { ReminderTemplateServerDTO } from '../../aggregates';

export interface ReminderTemplateDeletedEvent {
  identityId: string;
  templateId: string;
  templateTitle: string;
  reminder: ReminderTemplateServerDTO;
  isSoftDelete: boolean;
  deletedAt: number;
}
