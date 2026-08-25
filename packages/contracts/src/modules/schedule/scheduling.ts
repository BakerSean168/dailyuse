import type { Instant } from '../../primitives';

/** Neutral owner of one complete desired scheduling set. */
export interface SchedulingOwner {
  readonly identityId: string;
  readonly type: string;
  readonly id: string;
}

export type SchedulingPriority = 'low' | 'normal' | 'high' | 'urgent';

/** Retry policy expressed without leaking the legacy ScheduleTask aggregate. */
export interface SchedulingRetryPolicy {
  readonly enabled?: boolean;
  readonly maxRetries: number;
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
  readonly backoffMultiplier: number;
}

/** Desired future invocation owned by a business projector. */
export interface ScheduledIntent<TPayload = unknown> {
  readonly schedulingKey: string;
  readonly handlerKey: string;
  readonly runAt: Instant;
  readonly payloadVersion: number;
  readonly payload: TPayload;
  readonly sourceRevision?: number | string;
  readonly retryPolicy?: SchedulingRetryPolicy;
  readonly priority?: SchedulingPriority;
  readonly timeoutMs?: number | null;
  readonly observability?: {
    readonly name?: string;
    readonly tags?: readonly string[];
  };
}

export type SchedulingReconcileFailureCode =
  | 'INVALID_OWNER'
  | 'INVALID_INTENT'
  | 'DUPLICATE_SCHEDULING_KEY'
  | 'PERSISTED_KEY_COLLISION'
  | 'TRANSACTION_FAILED';

export interface SchedulingReconcileFailure {
  readonly code: SchedulingReconcileFailureCode;
  readonly message: string;
  readonly retryable: boolean;
}

/** Result of atomically reconciling one owner's complete desired set. */
export interface SchedulingReconcileReceipt {
  readonly operationId: string;
  readonly owner: SchedulingOwner;
  readonly status: 'succeeded' | 'failed';
  readonly desiredCount: number;
  readonly createdCount: number;
  readonly updatedCount: number;
  readonly deletedCount: number;
  readonly unchangedCount: number;
  readonly startedAt: Instant;
  readonly finishedAt: Instant;
  readonly failure?: SchedulingReconcileFailure;
}

export interface SchedulingPort {
  reconcile(
    owner: SchedulingOwner,
    desired: readonly ScheduledIntent[],
  ): Promise<SchedulingReconcileReceipt>;

  removeOwner(owner: SchedulingOwner): Promise<SchedulingReconcileReceipt>;
}

export interface ScheduledInvocationContext<TPayload = unknown> {
  readonly identityId: string;
  readonly owner: SchedulingOwner;
  readonly schedulingKey: string;
  readonly handlerKey: string;
  readonly runAt: Instant;
  readonly payloadVersion: number;
  readonly payload: TPayload;
  readonly sourceRevision?: number | string;
}

export type ScheduledHandlerFailureCode =
  | 'UNKNOWN_HANDLER'
  | 'UNSUPPORTED_PAYLOAD_VERSION'
  | 'PAYLOAD_VALIDATION_FAILED'
  | 'HANDLER_EXECUTION_FAILED'
  | string;

export interface ScheduledHandlerFailure {
  readonly code: ScheduledHandlerFailureCode;
  readonly message: string;
  readonly retryable: boolean;
}

export type ScheduledHandlerResult =
  | {
      readonly status: 'succeeded';
      readonly result?: Record<string, unknown>;
    }
  | {
      readonly status: 'skipped';
      readonly reason: string;
      readonly result?: Record<string, unknown>;
    }
  | {
      readonly status: 'retryable' | 'failed' | 'dead_letter';
      readonly failure: ScheduledHandlerFailure;
      readonly result?: Record<string, unknown>;
    };

export interface ScheduledHandler<TPayload = unknown> {
  execute(context: ScheduledInvocationContext<TPayload>): Promise<ScheduledHandlerResult>;
}

/** Registration owns payload versioning/validation; the registry owns dispatch only. */
export interface ScheduledHandlerRegistration<TPayload = unknown> {
  readonly handlerKey: string;
  readonly payloadVersion: number;
  readonly validatePayload: (payload: unknown) => TPayload;
  readonly handler: ScheduledHandler<TPayload>;
}
