import assert from 'node:assert/strict';
import test from 'node:test';
import { assertRegistry, ARTIFACT_REGISTRY, LANE_REGISTRY } from '../lib/registry.mjs';

test('lane and artifact registry is complete and extensible by data', () => {
  assert.equal(assertRegistry(), true);
  assert.deepEqual(Object.keys(LANE_REGISTRY).sort(), [
    'boundary',
    'coverage',
    'governance',
    'integration',
    'performance',
    'validate',
    'web',
  ]);
  assert.equal(ARTIFACT_REGISTRY.database.path, 'packages/database/dist');
  for (const definition of Object.values(LANE_REGISTRY)) {
    assert.ok(definition.inputs.includes('delivery-manifest'));
    assert.ok(definition.outputs.includes('lane-result'));
  }
});
