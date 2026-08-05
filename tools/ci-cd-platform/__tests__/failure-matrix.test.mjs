import assert from 'node:assert/strict';
import test from 'node:test';
import { validateLaneResult } from '../lib/contracts.mjs';

const base = {
  kind: 'lane-result-v1',
  version: 1,
  lane: 'validate',
  commit: 'sha',
  manifestDigest: 'm'.repeat(64),
  status: 'failure',
  timing: { setupMs: 1, executionMs: 2 },
  provenance: { runner: 'test' },
};

test('failure matrix keeps deterministic and infrastructure outcomes distinct', () => {
  for (const classification of [
    'assertion',
    'infrastructure',
    'process-crash',
    'timeout',
    'flaky',
  ]) {
    validateLaneResult({ ...base, failure: { classification } });
  }
  assert.throws(
    () => validateLaneResult({ ...base, failure: { classification: 'retry-everything' } }),
    /invalid failure classification/,
  );
});

test('cancelled and skipped results remain explicit states', () => {
  validateLaneResult({ ...base, status: 'cancelled', failure: { classification: 'none' } });
  validateLaneResult({ ...base, status: 'skipped', failure: { classification: 'none' } });
});
