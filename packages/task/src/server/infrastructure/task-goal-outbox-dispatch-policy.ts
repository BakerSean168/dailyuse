export interface TaskGoalOutboxDispatchStoreOptions {
  now?: () => Date;
  processingLeaseMs?: number;
  retryBaseDelayMs?: number;
  retryMaxDelayMs?: number;
  maxAttempts?: number;
}

export interface ResolvedTaskGoalOutboxDispatchStoreOptions {
  now: () => Date;
  processingLeaseMs: number;
  retryBaseDelayMs: number;
  retryMaxDelayMs: number;
  maxAttempts: number;
}

const DEFAULT_PROCESSING_LEASE_MS = 60_000;
const DEFAULT_RETRY_BASE_DELAY_MS = 1_000;
const DEFAULT_RETRY_MAX_DELAY_MS = 15 * 60_000;
const DEFAULT_MAX_ATTEMPTS = 10;
const MAX_CLAIM_BATCH_SIZE = 1_000;

export function resolveTaskGoalOutboxDispatchStoreOptions(
  options: TaskGoalOutboxDispatchStoreOptions = {},
): ResolvedTaskGoalOutboxDispatchStoreOptions {
  return {
    now: options.now ?? (() => new Date()),
    processingLeaseMs: positiveInteger(options.processingLeaseMs, DEFAULT_PROCESSING_LEASE_MS),
    retryBaseDelayMs: positiveInteger(options.retryBaseDelayMs, DEFAULT_RETRY_BASE_DELAY_MS),
    retryMaxDelayMs: positiveInteger(options.retryMaxDelayMs, DEFAULT_RETRY_MAX_DELAY_MS),
    maxAttempts: positiveInteger(options.maxAttempts, DEFAULT_MAX_ATTEMPTS),
  };
}

export function normalizeClaimLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit <= 0) return 0;
  return Math.min(Math.floor(limit), MAX_CLAIM_BATCH_SIZE);
}

export function retryAvailableAt(
  now: Date,
  currentAttempts: number,
  options: Pick<ResolvedTaskGoalOutboxDispatchStoreOptions, 'retryBaseDelayMs' | 'retryMaxDelayMs'>,
): Date {
  const exponent = Math.min(Math.max(0, currentAttempts), 30);
  const delay = Math.min(options.retryMaxDelayMs, options.retryBaseDelayMs * 2 ** exponent);
  return new Date(now.getTime() + delay);
}

function positiveInteger(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && value !== undefined && value > 0 ? Math.floor(value) : fallback;
}
