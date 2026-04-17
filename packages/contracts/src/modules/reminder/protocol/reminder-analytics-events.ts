import type { ReminderResponseAction } from '../entities/reminder-response-server';

/**
 * Application/integration events emitted by reminder services.
 *
 * These are not aggregate domain events:
 * - `reminder:response:recorded` is produced when a ReminderResponse entity is persisted.
 * - `reminder:frequency:*` events are produced by the smart-frequency application service.
 */

export interface ReminderResponseRecordedEvent {
  identityId: string;
  responseId: string;
  templateId: string;
  action: ReminderResponseAction;
  responseTime: number | null;
  recordedAt: number;
}

export interface ReminderFrequencyAdjustedEvent {
  identityId: string;
  templateId: string;
  originalInterval: number;
  adjustedInterval: number;
  reason: string;
  adjustedAt: number;
}

export interface ReminderFrequencyAdjustmentRejectedEvent {
  identityId: string;
  templateId: string;
  rejectedAt: number;
}
