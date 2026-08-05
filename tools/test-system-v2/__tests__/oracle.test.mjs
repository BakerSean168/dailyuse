import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateOracle } from '../lib/oracle.mjs';

test('passes when enabled children succeed and disabled children skip', () => {
  assert.deepEqual(
    evaluateOracle({
      enabled: ['unit'],
      children: { unit: 'success', build: 'skipped' },
    }),
    { state: 'success', failures: [] },
  );
});

test('fails closed when the detector fails', () => {
  assert.deepEqual(evaluateOracle({ detector: 'failure', children: {} }), {
    state: 'detector-failure',
    failures: ['detector:failure'],
  });
});

for (const result of ['failure', 'cancelled', 'skipped']) {
  test(`fails when an enabled child is ${result}`, () => {
    assert.equal(
      evaluateOracle({ enabled: ['unit'], children: { unit: result } }).state,
      'failure',
    );
  });
}

test('rejects an unexpected run for a disabled child', () => {
  assert.equal(evaluateOracle({ enabled: [], children: { unit: 'success' } }).state, 'failure');
});
