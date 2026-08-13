/**
 * ReminderMetricsCollector - Telemetry metrics for due latency, claims, failures, retries, dead-letters.
 */

import type { UnifiedOperationMetricsRecorder } from '@memoflow/patterns/operations';
import { createUnifiedOperationMetricsRecorder, globalUnifiedOperationMetrics } from '@memoflow/patterns/operations';

export interface ReminderMetricsSnapshot {
  readonly dueLatencyTotalMs: number;
  readonly dueLatencyCount: number;
  readonly avgDueLatencyMs: number;
  readonly persistedTotal: number;
  readonly claimedTotal: number;
  readonly succeededTotal: number;
  readonly failedTotal: number;
  readonly retryTotal: number;
  readonly deadLetterTotal: number;
}

export class ReminderMetricsCollector {
  private dueLatencyTotalMs = 0;
  private dueLatencyCount = 0;
  private persistedTotal = 0;
  private claimedTotal = 0;
  private succeededTotal = 0;
  private failedTotal = 0;
  private retryTotal = 0;
  private deadLetterTotal = 0;
  private readonly unified: UnifiedOperationMetricsRecorder;

  constructor(unified?: UnifiedOperationMetricsRecorder) {
    this.unified = unified ?? createUnifiedOperationMetricsRecorder();
  }

  recordDueLatency(latencyMs: number): void {
    if (latencyMs >= 0) {
      this.dueLatencyTotalMs += latencyMs;
      this.dueLatencyCount += 1;
    }
  }

  recordPersisted(): void {
    this.persistedTotal += 1;
    this.unified.recordOutbox('reminder', 'persisted');
  }

  recordClaimed(): void {
    this.claimedTotal += 1;
    this.unified.recordOutbox('reminder', 'claimed');
  }

  recordSucceeded(): void {
    this.succeededTotal += 1;
    this.unified.recordOutbox('reminder', 'succeeded');
  }

  recordFailed(): void {
    this.failedTotal += 1;
    this.unified.recordOutbox('reminder', 'failed');
  }

  recordRetry(): void {
    this.retryTotal += 1;
    this.unified.recordOutbox('reminder', 'retried');
  }

  recordDeadLetter(): void {
    this.deadLetterTotal += 1;
    this.unified.recordOutbox('reminder', 'dead_letter');
  }

  recordWorkerOutcome(outcome: 'completed' | 'failed' | 'retried' | 'skipped'): void {
    this.unified.recordWorker('reminder', outcome);
  }

  getSnapshot(): ReminderMetricsSnapshot {
    return {
      dueLatencyTotalMs: this.dueLatencyTotalMs,
      dueLatencyCount: this.dueLatencyCount,
      avgDueLatencyMs: this.dueLatencyCount > 0 ? this.dueLatencyTotalMs / this.dueLatencyCount : 0,
      persistedTotal: this.persistedTotal,
      claimedTotal: this.claimedTotal,
      succeededTotal: this.succeededTotal,
      failedTotal: this.failedTotal,
      retryTotal: this.retryTotal,
      deadLetterTotal: this.deadLetterTotal,
    };
  }

  getUnifiedSnapshot(): Readonly<Record<string, number>> {
    return this.unified.snapshot();
  }

  reset(): void {
    this.dueLatencyTotalMs = 0;
    this.dueLatencyCount = 0;
    this.persistedTotal = 0;
    this.claimedTotal = 0;
    this.succeededTotal = 0;
    this.failedTotal = 0;
    this.retryTotal = 0;
    this.deadLetterTotal = 0;
  }
}

export const globalReminderMetrics = new ReminderMetricsCollector(globalUnifiedOperationMetrics);
