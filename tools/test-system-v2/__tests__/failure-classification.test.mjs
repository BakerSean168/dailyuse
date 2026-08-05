import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyFailure } from '../lib/failure-classification.mjs';

test('classifies assertion, infrastructure, crash, timeout, and flaky outcomes', () => {
  assert.equal(classifyFailure({ output: 'AssertionError' }), 'assertion');
  assert.equal(classifyFailure({ output: 'spawn pnpm ENOENT' }), 'infrastructure');
  assert.equal(classifyFailure({ signal: 'SIGSEGV' }), 'process-crash');
  assert.equal(classifyFailure({ timedOut: true }), 'timeout');
  assert.equal(classifyFailure({ output: 'known flaky test' }), 'flaky');
});
