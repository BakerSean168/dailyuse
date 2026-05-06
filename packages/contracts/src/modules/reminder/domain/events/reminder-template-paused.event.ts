import type { IdentityId, ReminderTemplateId } from '../../../../primitives';
import type { ReminderTemplateServerDTO } from '../../aggregates/reminder-template-server';

export interface ReminderTemplatePausedEvent {
  identityId: IdentityId;
  templateId: ReminderTemplateId;
  reminder: ReminderTemplateServerDTO;
}
