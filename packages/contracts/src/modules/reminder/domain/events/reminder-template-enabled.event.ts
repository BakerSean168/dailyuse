import type { IdentityId, ReminderTemplateId } from '../../../../primitives';
import type { ReminderTemplateServerDTO } from '../../aggregates/reminder-template-server';

export interface ReminderTemplateEnabledEvent {
  identityId: IdentityId;
  templateId: ReminderTemplateId;
  activatedAt: number;
  reminder: ReminderTemplateServerDTO;
}
