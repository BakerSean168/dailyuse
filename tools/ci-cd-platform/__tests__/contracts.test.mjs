import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildProvenance,
  digest,
  validateDeliveryManifest,
  validateLaneInput,
  validateLaneResult,
} from '../lib/contracts.mjs';

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

test('validates a delivery manifest and gives deterministic provenance', () => {
  const input = { head: 'head', files: ['apps/web/src/App.vue'] };
  const manifest = {
    kind: 'delivery-manifest-v1',
    version: 1,
    commit: 'head',
    base: 'base',
    head: 'head',
    event: 'pull_request',
    full: false,
    changedFiles: input.files,
    risk: {
      level: 'web-flow',
      reasons: ['Web application or browser flow changed'],
      matchedLevels: ['web-flow'],
    },
    scope,
    lanes: {
      governance: true,
      validate: true,
      boundary: false,
      integration: false,
      web: true,
      coverage: false,
      performance: false,
    },
    provenance: buildProvenance({ generator: 'test', input }),
  };
  manifest.digest = digest(manifest);
  validateDeliveryManifest(manifest);
  assert.equal(digest(input), digest({ files: input.files, head: input.head }));
  assert.match(manifest.provenance.inputDigest, /^[a-f0-9]{64}$/u);
});

test('rejects missing or unsupported contract fields', () => {
  assert.throws(
    () => validateDeliveryManifest({ kind: 'delivery-manifest-v1', version: 2 }),
    /unsupported manifest version/,
  );
  assert.throws(() => validateLaneInput({ kind: 'lane-input-v1', version: 1 }), /lane must be/);
  assert.throws(
    () =>
      validateLaneResult({
        kind: 'lane-result-v1',
        version: 1,
        lane: 'web',
        commit: 'x',
        manifestDigest: 'a'.repeat(64),
        status: 'unknown',
      }),
    /invalid lane status/,
  );
});

test('accepts a complete lane input and result', () => {
  const input = {
    kind: 'lane-input-v1',
    version: 1,
    lane: 'web',
    commit: 'head',
    manifestDigest: 'a'.repeat(64),
    inputs: ['apps/web'],
    outputs: ['results.json'],
    environment: { isolation: 'dedicated' },
    cache: { read: ['playwright'], write: [] },
    failurePolicy: { retry: 'infrastructure-only', timeoutMinutes: 30 },
    owner: 'web',
    capabilities: ['node', 'pnpm'],
    policy: {},
    scope: { version: 1, projects: [] },
    risk: { level: 'docs' },
  };
  input.digest = digest(input);
  validateLaneInput(input);
  const result = {
    kind: 'lane-result-v1',
    version: 1,
    lane: 'web',
    commit: 'head',
    manifestDigest: 'a'.repeat(64),
    laneInputDigest: input.digest,
    status: 'success',
    failure: { classification: 'none' },
    timing: { setupMs: 1, executionMs: 2 },
    provenance: { runner: 'ubuntu-latest' },
  };
  result.digest = digest(result);
  validateLaneResult(result);
});
