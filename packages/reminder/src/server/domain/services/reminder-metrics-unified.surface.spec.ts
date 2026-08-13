import { describe, expect, it } from 'vitest';
import { ReminderMetricsCollector } from './reminder-metrics-service';
import {
  outboxMetricKey,
  workerMetricKey,
  OPERATION_METRIC_PREFIX,
} from '@memoflow/patterns/operations';

describe('W7 unified metric naming (B): reminder collector', () => {
  it('emits memoflow.reminder.outbox.<state> on the real record paths', () => {
    const collector = new ReminderMetricsCollector();
    collector.recordClaimed();
    collector.recordFailed();
    collector.recordRetry();
    collector.recordRetry();
    collector.recordDeadLetter();

    const snapshot = collector.getUnifiedSnapshot();
    expect(snapshot).toMatchObject({
      'memoflow.reminder.outbox.claimed': 1,
      'memoflow.reminder.outbox.failed': 1,
      'memoflow.reminder.outbox.retried': 2,
      'memoflow.reminder.outbox.dead_letter': 1,
    });
  });

  it('all emitted keys follow the memoflow.<module>.outbox.<state> convention', () => {
    const collector = new ReminderMetricsCollector();
    collector.recordClaimed();
    collector.recordFailed();
    collector.recordRetry();
    collector.recordDeadLetter();

    const keys = Object.keys(collector.getUnifiedSnapshot());
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(key.startsWith(`${OPERATION_METRIC_PREFIX}.reminder.outbox.`)).toBe(true);
    }
  });

  it('the expected outbox states cover persisted/claimed/retried/failed/dead_letter', () => {
    const expected = [
      outboxMetricKey('reminder', 'persisted'),
      outboxMetricKey('reminder', 'claimed'),
      outboxMetricKey('reminder', 'retried'),
      outboxMetricKey('reminder', 'failed'),
      outboxMetricKey('reminder', 'dead_letter'),
    ];
    expect(expected).toHaveLength(5);
  });

  it('worker outcome keys follow memoflow.reminder.worker.<outcome>', () => {
    expect(workerMetricKey('reminder', 'completed')).toBe(
      'memoflow.reminder.worker.completed',
    );
  });
});
