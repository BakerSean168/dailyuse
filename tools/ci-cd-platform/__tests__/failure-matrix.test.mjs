import assert from 'node:assert/strict';
import test from 'node:test';
import { digest, validateLaneResult } from '../lib/contracts.mjs';

const base = {
  kind: 'lane-result-v1',
  version: 1,
  lane: 'validate',
  commit: 'sha',
  manifestDigest: 'a'.repeat(64),
  laneInputDigest: 'b'.repeat(64),
  status: 'failure',
  timing: { setupMs: 1, executionMs: 2 },
  provenance: { runner: 'test' },
};

function result(overrides) {
  const value = { ...base, ...overrides };
  value.digest = digest(value);
  return value;
}

test('failure matrix keeps deterministic and infrastructure outcomes distinct', () => {
  for (const classification of [
    'assertion',
    'infrastructure',
    'process-crash',
    'timeout',
    'flaky',
  ]) {
    validateLaneResult(result({ failure: { classification } }));
  }
  assert.throws(
    () => validateLaneResult(result({ failure: { classification: 'retry-everything' } })),
    /invalid failure classification/,
  );
});

test('cancelled and skipped results remain explicit states', () => {
  validateLaneResult(result({ status: 'cancelled', failure: { classification: 'none' } }));
  validateLaneResult(result({ status: 'skipped', failure: { classification: 'none' } }));
});
