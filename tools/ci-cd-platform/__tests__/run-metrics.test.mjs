import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeGitHubRun } from '../collect-github-run-metrics.mjs';

test('GitHub run metrics include completed and currently running jobs', () => {
  const metrics = summarizeGitHubRun({
    run: { run_started_at: '2026-08-05T00:00:00Z' },
    jobs: {
      total_count: 3,
      jobs: [
        {
          started_at: '2026-08-05T00:00:30Z',
          completed_at: '2026-08-05T00:01:30Z',
        },
        {
          started_at: '2026-08-05T00:02:00Z',
          completed_at: null,
        },
        { started_at: null, completed_at: null },
      ],
    },
    now: Date.parse('2026-08-05T00:05:00Z'),
  });

  assert.equal(metrics.startedAt, '2026-08-05T00:00:00.000Z');
  assert.equal(metrics.runnerMinutes, 4);
});

test('GitHub run metrics fail closed on incomplete or invalid metadata', () => {
  assert.throws(
    () =>
      summarizeGitHubRun({
        run: { run_started_at: '2026-08-05T00:00:00Z' },
        jobs: { total_count: 2, jobs: [{ started_at: null }] },
      }),
    /pagination is required/,
  );
  assert.throws(
    () =>
      summarizeGitHubRun({
        run: { run_started_at: 'invalid' },
        jobs: { total_count: 0, jobs: [] },
      }),
    /ISO-8601 timestamp/,
  );
});

test('GitHub run metrics skip skipped jobs with timestamps that precede start', () => {
  const metrics = summarizeGitHubRun({
    run: { run_started_at: '2026-08-05T00:00:00Z' },
    jobs: {
      total_count: 2,
      jobs: [
        {
          conclusion: 'skipped',
          started_at: '2026-08-05T00:00:33Z',
          completed_at: '2026-08-05T00:00:32Z',
        },
        {
          conclusion: 'success',
          started_at: '2026-08-05T00:01:00Z',
          completed_at: '2026-08-05T00:02:00Z',
        },
      ],
    },
    now: Date.parse('2026-08-05T00:05:00Z'),
  });

  assert.equal(metrics.runnerMinutes, 1);
});

test('GitHub run metrics skip skipped jobs with equal timestamps', () => {
  const metrics = summarizeGitHubRun({
    run: { run_started_at: '2026-08-05T00:00:00Z' },
    jobs: {
      total_count: 1,
      jobs: [
        {
          conclusion: 'skipped',
          started_at: '2026-08-05T00:00:33Z',
          completed_at: '2026-08-05T00:00:33Z',
        },
      ],
    },
    now: Date.parse('2026-08-05T00:05:00Z'),
  });

  assert.equal(metrics.runnerMinutes, 0);
});

test('GitHub run metrics fail closed on non-skipped job with completion before start', () => {
  assert.throws(
    () =>
      summarizeGitHubRun({
        run: { run_started_at: '2026-08-05T00:00:00Z' },
        jobs: {
          total_count: 1,
          jobs: [
            {
              conclusion: 'success',
              started_at: '2026-08-05T00:00:33Z',
              completed_at: '2026-08-05T00:00:32Z',
            },
          ],
        },
        now: Date.parse('2026-08-05T00:05:00Z'),
      }),
    /job completion precedes job start/,
  );
});

test('GitHub run metrics account for docs-only mixed skipped and normal jobs', () => {
  const metrics = summarizeGitHubRun({
    run: { run_started_at: '2026-08-05T00:00:00Z' },
    jobs: {
      total_count: 4,
      jobs: [
        {
          conclusion: 'skipped',
          started_at: '2026-08-05T00:00:33Z',
          completed_at: '2026-08-05T00:00:32Z',
        },
        {
          conclusion: 'skipped',
          started_at: '2026-08-05T00:00:34Z',
          completed_at: '2026-08-05T00:00:34Z',
        },
        {
          conclusion: 'success',
          started_at: '2026-08-05T00:00:30Z',
          completed_at: '2026-08-05T00:01:30Z',
        },
        {
          conclusion: 'failure',
          started_at: '2026-08-05T00:02:00Z',
          completed_at: '2026-08-05T00:03:00Z',
        },
      ],
    },
    now: Date.parse('2026-08-05T00:05:00Z'),
  });

  assert.equal(metrics.runnerMinutes, 2);
});
