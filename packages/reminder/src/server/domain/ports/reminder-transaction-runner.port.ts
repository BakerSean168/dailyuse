import type { BusinessOperationReceipt } from '@memoflow/contracts/reliable-messaging';
import type { ReminderTemplate } from '../aggregates/reminder-template';

export interface ExecuteClaimedOccurrenceTransactionParams {
  readonly template: ReminderTemplate;
  readonly occurrence: {
    readonly id: string;
    readonly identityId: string;
    readonly templateId: string;
    readonly occurrenceKey: string;
    readonly idempotencyKey: string;
    readonly fencingToken: number;
    readonly ownerToken: string;
  };
  readonly isEnabled: boolean;
  readonly skipReason?: string;
  readonly triggerTime?: number;
  readonly beforeCommitHook?: () => Promise<void>;
}

export interface ReminderTransactionRunner {
  executeClaimedOccurrenceTransaction(
    params: ExecuteClaimedOccurrenceTransactionParams,
  ): Promise<BusinessOperationReceipt>;
}
