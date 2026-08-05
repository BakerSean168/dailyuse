import assert from 'node:assert/strict';
import test from 'node:test';
import { runFaultInjection } from '../run-fault-injection.mjs';

test('all platform fault scenarios fail closed', async () => {
  const report = await runFaultInjection();
  assert.equal(report.kind, 'fault-injection-report-v1');
  assert.equal(report.status, 'passed');
  assert.deepEqual(
    report.scenarios.map((scenario) => scenario.name),
    [
      'detector-failure',
      'cancelled-child',
      'manifest-missing-field',
      'artifact-source-mismatch',
      'permission-provenance-denied',
      'artifact-content-mismatch',
      'runtime-closure-entry-missing',
    ],
  );
  assert(report.scenarios.every((scenario) => scenario.observed === 'fail-closed'));
});
