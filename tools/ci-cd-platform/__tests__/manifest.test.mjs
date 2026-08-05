import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDeliveryManifest } from '../generate-delivery-manifest.mjs';

const scope = {
  version: 1,
  base: 'base',
  head: 'head',
  full: false,
  projects: ['web'],
  unit: ['web'],
  coverage: [],
  smoke: [],
  integration: [],
  boundary: [],
  perf: [],
  webFlow: true,
};

test('builds one deterministic delivery manifest from injected scope', async () => {
  const options = {
    base: 'base',
    head: 'head',
    event: 'pull_request',
    scope,
    files: ['apps/web/src/App.vue'],
  };
  const first = await buildDeliveryManifest(options);
  const second = await buildDeliveryManifest(options);
  assert.equal(first.digest, second.digest);
  assert.equal(first.kind, 'delivery-manifest-v1');
  assert.equal(first.risk.level, 'web-flow');
  assert.equal(first.lanes.web, true);
  assert.equal(first.lanes.integration, false);
});
