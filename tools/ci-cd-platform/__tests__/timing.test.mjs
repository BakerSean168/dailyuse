import assert from 'node:assert/strict';
import test from 'node:test';
import { compareTimings } from '../compare-timings.mjs';
import { digest } from '../lib/contracts.mjs';

function summary(index, lanes = ['governance', 'validate']) {
  const value = {
    kind: 'run-summary-v1',
    version: 1,
    commit: `sha-${index}`,
    manifestDigest: `${String(index).padStart(2, '0')}${'a'.repeat(62)}`,
    status: 'success',
    lanes: lanes.map((lane) => ({
      lane,
      status: 'success',
      timing: { setupMs: 10, executionMs: 20 },
      failures: [],
      evidence: [],
    })),
    missingLanes: [],
    timing: {
      setupMs: 100 + index,
      executionMs: 200 + index,
      longestLaneMs: 150 + index,
      wallClockMs: 500 + index,
      runnerMinutes: 4 + index / 10,
    },
    provenance: { generator: 'test', runId: `run-${index}` },
  };
  value.digest = digest(value);
  return value;
}

test('timing comparator produces deterministic P50/P95 for comparable runs', () => {
  const report = compareTimings({
    summaries: [1, 2, 3, 4, 5].map((index) => summary(index)),
    profile: 'runtime-web-flow',
  });
  assert.equal(report.kind, 'timing-report-v1');
  assert.equal(report.sampleCount, 5);
  assert.equal(report.metrics.setupMs.p50, 103);
  assert.equal(report.metrics.setupMs.p95, 104.8);
  assert.equal(report.metrics.runnerMinutes.p50, 4.3);
});

test('timing comparator rejects mismatched lane sets and insufficient samples', () => {
  assert.throws(
    () => compareTimings({ summaries: [summary(1)], profile: 'runtime-web-flow' }),
    /at least 5 comparable timing runs/,
  );
  assert.throws(
    () =>
      compareTimings({
        summaries: [1, 2, 3, 4].map((index) => summary(index)).concat(summary(5, ['governance'])),
        profile: 'runtime-web-flow',
      }),
    /same enabled lane set/,
  );
});
