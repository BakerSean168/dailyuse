import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createLaneInput } from '../create-lane-input.mjs';
import { observeLane } from '../observe-lane.mjs';
import { digest } from '../lib/contracts.mjs';

test('observation aggregates command evidence without changing lane semantics', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'memoflow-observe-'));
  const reports = path.join(root, 'reports');
  await mkdir(reports, { recursive: true });
  const manifest = {
    kind: 'delivery-manifest-v1',
    version: 1,
    commit: 'head',
    base: 'base',
    head: 'head',
    event: 'pull_request',
    full: false,
    changedFiles: [],
    risk: { level: 'docs', reasons: ['docs'], matchedLevels: ['docs'] },
    scope: {
      version: 1,
      projects: [],
      unit: [],
      coverage: [],
      smoke: [],
      integration: [],
      boundary: [],
      perf: [],
      webFlow: false,
    },
    lanes: {
      governance: true,
      validate: true,
      boundary: false,
      integration: false,
      web: false,
      coverage: false,
      performance: false,
    },
    provenance: { generator: 'test', inputDigest: 'a'.repeat(64) },
  };
  manifest.digest = digest(manifest);
  const input = await createLaneInput({
    lane: 'governance',
    manifest,
    output: path.join(root, 'input.json'),
  });
  await writeFile(
    path.join(reports, 'governance.json'),
    JSON.stringify({
      version: 1,
      name: 'governance',
      result: 'success',
      attempts: [{ attempt: 1, durationMs: 12, classification: 'success' }],
    }),
  );
  const output = path.join(root, 'summary.json');
  const summary = await observeLane({ lane: 'governance', input, reportsDir: reports, output });
  assert.equal(summary.status, 'success');
  assert.equal(summary.timing.executionMs, 12);
  assert.equal(JSON.parse(await readFile(output, 'utf8')).lane, 'governance');
});
