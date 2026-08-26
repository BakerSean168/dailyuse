import type { BusinessOperationReceipt } from '@memoflow/contracts/reliable-messaging';

export interface RoutineOccurrenceNotificationRequestInput {
  readonly identityId: string;
  readonly routineId: string;
  readonly occurrenceKey: string;
  readonly scheduledFor: number;
  readonly sourceRevision: string | number | null;
  readonly title: string;
  readonly content: string;
  readonly operationId?: string;
}

/**
 * Durable notification intent for a committed routine occurrence.
 *
 * The writer must enqueue a `notification.requested` envelope (NOTIF-3301)
 * idempotently keyed by (identityId/source='routine'/occurrenceKey) so a
 * crash/retry replay never surfaces a duplicate notification. Writing happens
 * inside the occurrence commit transaction in production.
 */
export interface RoutineOccurrenceNotificationWriterPort {
  enqueueRoutineOccurrenceRequested(
    input: RoutineOccurrenceNotificationRequestInput,
  ): Promise<BusinessOperationReceipt>;
}