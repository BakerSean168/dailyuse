import assert from 'node:assert/strict';
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
