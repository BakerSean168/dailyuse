import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { observeRun } from '../observe-run.mjs';
import { digest } from '../lib/contracts.mjs';

test('run observation detects missing enabled lanes and preserves provenance', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'memoflow-run-observe-'));
  const evidence = path.join(root, 'evidence', 'job');
  await mkdir(evidence, { recursive: true });
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
  const laneInputDigest = 'b'.repeat(64);
  const laneSummary = {
    kind: 'lane-summary-v1',
    version: 1,
    lane: 'governance',
    commit: 'head',
    manifestDigest: manifest.digest,
    laneInputDigest,
    status: 'success',
    timing: { setupMs: 5, executionMs: 10 },
    failures: [],
    provenance: { generator: 'test' },
  };
  laneSummary.digest = digest(laneSummary);
  await writeFile(path.join(evidence, 'governance-summary.json'), JSON.stringify(laneSummary));
  const output = path.join(root, 'run-summary.json');
  const summary = await observeRun({
    manifest,
    evidenceDir: path.join(root, 'evidence'),
    output,
    startedAt: '2026-08-05T00:00:00Z',
    runnerMinutes: '1.25',
    now: Date.parse('2026-08-05T00:02:00Z'),
  });
  assert.equal(summary.status, 'incomplete');
  assert.deepEqual(summary.missingLanes, ['validate']);
  assert.equal(summary.timing.wallClockMs, 120_000);
  assert.equal(summary.timing.runnerMinutes, 1.25);
  assert.equal(JSON.parse(await readFile(output, 'utf8')).manifestDigest, manifest.digest);
});
