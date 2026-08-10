/**
 * Notification Metrics Service
 *
 * Telemetry counters for Notification channel durable outbox dispatch lifecycle:
 * - persisted
 * - dispatched
 * - delivered
 * - failed
 * - retry
 * - dead-letter
 */

export interface NotificationMetricsSnapshot {
  readonly persistedTotal: number;
  readonly dispatchedTotal: number;
  readonly deliveredTotal: number;
  readonly failedTotal: number;
  readonly retryTotal: number;
  readonly deadLetterTotal: number;
}

export class NotificationMetricsService {
  private persistedTotal = 0;
  private dispatchedTotal = 0;
  private deliveredTotal = 0;
  private failedTotal = 0;
  private retryTotal = 0;
  private deadLetterTotal = 0;

  recordPersisted(count = 1): void {
    this.persistedTotal += count;
  }

  recordDispatched(count = 1): void {
    this.dispatchedTotal += count;
  }

  recordDelivered(count = 1): void {
    this.deliveredTotal += count;
  }

  recordFailed(count = 1): void {
    this.failedTotal += count;
  }

  recordRetry(count = 1): void {
    this.retryTotal += count;
  }

  recordDeadLetter(count = 1): void {
    this.deadLetterTotal += count;
  }

  getMetrics(): NotificationMetricsSnapshot {
    return {
      persistedTotal: this.persistedTotal,
      dispatchedTotal: this.dispatchedTotal,
      deliveredTotal: this.deliveredTotal,
      failedTotal: this.failedTotal,
      retryTotal: this.retryTotal,
      deadLetterTotal: this.deadLetterTotal,
    };
  }

  resetMetrics(): void {
    this.persistedTotal = 0;
    this.dispatchedTotal = 0;
    this.deliveredTotal = 0;
    this.failedTotal = 0;
    this.retryTotal = 0;
    this.deadLetterTotal = 0;
  }
}
