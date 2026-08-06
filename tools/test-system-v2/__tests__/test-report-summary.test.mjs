import assert from 'node:assert/strict';
import test from 'node:test';
import {
  aggregateTestSummaries,
  summarizePlaywrightReport,
  summarizeVitestReport,
} from '../lib/test-report-summary.mjs';

test('summarizes Vitest counts, retries and slowest tests', () => {
  const summary = summarizeVitestReport({
    numTotalTests: 3,
    numPassedTests: 1,
    numFailedTests: 1,
    numPendingTests: 1,
    numTodoTests: 0,
    testResults: [
      {
        name: 'a.test.ts',
        status: 'failed',
        startTime: 10,
        endTime: 40,
        assertionResults: [
          { fullName: 'slow', duration: 20, status: 'failed', retryCount: 1 },
          { fullName: 'fast', duration: 2, status: 'passed' },
        ],
      },
      {
        name: 'b.test.ts',
        status: 'pending',
        startTime: 10,
        endTime: 15,
        assertionResults: [],
      },
    ],
  });
  assert.deepEqual(summary.files, { total: 2, passed: 0, failed: 1, skipped: 1 });
  assert.deepEqual(summary.tests, { total: 3, passed: 1, failed: 1, skipped: 1, retries: 1 });
  assert.equal(summary.slowestTests[0].name, 'slow');
});

test('summarizes Playwright final statuses and retry attempts', () => {
  const summary = summarizePlaywrightReport({
    config: {},
    suites: [
      {
        specs: [
          {
            file: 'flow.spec.ts',
            title: 'works',
            tests: [{ status: 'flaky', results: [{ duration: 5 }, { duration: 9 }] }],
          },
          {
            file: 'skip.spec.ts',
            title: 'skips',
            tests: [{ status: 'skipped', results: [] }],
          },
        ],
      },
    ],
  });
  assert.deepEqual(summary.files, { total: 2, passed: 1, failed: 0, skipped: 1 });
  assert.deepEqual(summary.tests, { total: 2, passed: 1, failed: 0, skipped: 1, retries: 1 });
  assert.equal(summary.slowestTests[0].durationMs, 9);
});

test('aggregates framework reports without losing slowest evidence', () => {
  const vitest = summarizeVitestReport({
    numTotalTests: 1,
    numPassedTests: 1,
    testResults: [
      {
        name: 'unit.test.ts',
        status: 'passed',
        startTime: 0,
        endTime: 12,
        assertionResults: [{ fullName: 'unit', duration: 10, status: 'passed' }],
      },
    ],
  });
  const total = aggregateTestSummaries([vitest]);
  assert.equal(total.reportCount, 1);
  assert.equal(total.tests.total, 1);
  assert.equal(total.slowestSpecs[0].name, 'unit.test.ts');
});
