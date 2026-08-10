/**
 * ReminderMetricsCollector - Telemetry metrics for due latency, claims, failures, retries, dead-letters.
 */

export interface ReminderMetricsSnapshot {
  readonly dueLatencyTotalMs: number;
  readonly dueLatencyCount: number;
  readonly avgDueLatencyMs: number;
  readonly claimedTotal: number;
  readonly failedTotal: number;
  readonly retryTotal: number;
  readonly deadLetterTotal: number;
}

export class ReminderMetricsCollector {
  private dueLatencyTotalMs = 0;
  private dueLatencyCount = 0;
  private claimedTotal = 0;
  private failedTotal = 0;
  private retryTotal = 0;
  private deadLetterTotal = 0;

  recordDueLatency(latencyMs: number): void {
    if (latencyMs >= 0) {
      this.dueLatencyTotalMs += latencyMs;
      this.dueLatencyCount += 1;
    }
  }

  recordClaimed(): void {
    this.claimedTotal += 1;
  }

  recordFailed(): void {
    this.failedTotal += 1;
  }

  recordRetry(): void {
    this.retryTotal += 1;
  }

  recordDeadLetter(): void {
    this.deadLetterTotal += 1;
  }

  getSnapshot(): ReminderMetricsSnapshot {
    return {
      dueLatencyTotalMs: this.dueLatencyTotalMs,
      dueLatencyCount: this.dueLatencyCount,
      avgDueLatencyMs: this.dueLatencyCount > 0 ? this.dueLatencyTotalMs / this.dueLatencyCount : 0,
      claimedTotal: this.claimedTotal,
      failedTotal: this.failedTotal,
      retryTotal: this.retryTotal,
      deadLetterTotal: this.deadLetterTotal,
    };
  }

  reset(): void {
    this.dueLatencyTotalMs = 0;
    this.dueLatencyCount = 0;
    this.claimedTotal = 0;
    this.failedTotal = 0;
    this.retryTotal = 0;
    this.deadLetterTotal = 0;
  }
}

export const globalReminderMetrics = new ReminderMetricsCollector();
