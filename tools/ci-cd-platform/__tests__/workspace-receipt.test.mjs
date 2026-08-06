import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { digest, validateWorkspaceReceipt } from '../lib/contracts.mjs';

test('workspace receipt binds toolchain and cache facts to a digest', () => {
  const receipt = {
    kind: 'workspace-receipt-v1',
    version: 1,
    commit: 'sha',
    runner: { os: 'linux', arch: 'x64' },
    toolchain: { node: 'v24.0.0', pnpm: '10.0.0' },
    capabilities: ['node', 'pnpm'],
    cache: { pnpm: 'true', nx: 'false', playwright: 'false' },
    timing: { setupMs: 100 },
    provenance: { generator: 'test', inputDigest: 'a'.repeat(64) },
  };
  receipt.digest = digest(receipt);
  assert.equal(validateWorkspaceReceipt(receipt), receipt);
  assert.throws(
    () => validateWorkspaceReceipt({ ...receipt, timing: { setupMs: 101 } }),
    /does not match content/,
  );
});

test('workspace receipt prefers the affected head over the pull request merge commit', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'memoflow-workspace-receipt-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const output = path.join(directory, 'workspace-receipt.json');
  const result = spawnSync(process.execPath, ['tools/ci-cd-platform/write-workspace-receipt.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_SHA: 'merge-commit',
      NX_HEAD: 'head-commit',
      WORKSPACE_RECEIPT_OUTPUT: output,
    },
  });

  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(await readFile(output, 'utf8'));
  assert.equal(receipt.commit, 'head-commit');
  assert.equal(validateWorkspaceReceipt(receipt), receipt);
});
