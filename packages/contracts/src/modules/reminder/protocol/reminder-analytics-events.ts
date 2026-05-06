import type { IdentityId, ReminderResponseId, ReminderTemplateId } from '../../../primitives/ids';
import type { ReminderResponseAction } from '../entities/reminder-response-server';

/**
 * Application/integration events emitted by reminder services.
 *
 * These are not aggregate domain events:
 * - `reminder:response:recorded` is produced when a ReminderResponse entity is persisted.
 * - `reminder:frequency:*` events are produced by the smart-frequency application service.
 */

export interface ReminderResponseRecordedEvent {
  identityId: IdentityId;
  responseId: ReminderResponseId;
  templateId: ReminderTemplateId;
  action: ReminderResponseAction;
  responseTime: number | null;
  recordedAt: number;
}

export interface ReminderFrequencyAdjustedEvent {
  identityId: IdentityId;
  templateId: ReminderTemplateId;
  originalInterval: number;
  adjustedInterval: number;
  reason: string;
  adjustedAt: number;
}

export interface ReminderFrequencyAdjustmentRejectedEvent {
  identityId: IdentityId;
  templateId: ReminderTemplateId;
  rejectedAt: number;
}
