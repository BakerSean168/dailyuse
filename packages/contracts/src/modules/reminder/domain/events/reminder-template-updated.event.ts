import type { IdentityId, ReminderTemplateId } from '../../../../primitives';
import type { ReminderTemplateServerDTO } from '../../aggregates/reminder-template-server';

export interface ReminderTemplateUpdatedEvent {
  identityId: IdentityId;
  templateId: ReminderTemplateId;
  reminder: ReminderTemplateServerDTO;
  changes: string[];
}
