import type { IdentityId, ReminderTemplateId } from '../../../../primitives';
import type { ReminderTemplateServerDTO } from '../../aggregates/reminder-template-server';

export interface ReminderTemplateDeletedEvent {
  identityId: IdentityId;
  templateId: ReminderTemplateId;
  templateTitle: string;
  reminder: ReminderTemplateServerDTO;
  isSoftDelete: boolean;
  deletedAt: number;
}
