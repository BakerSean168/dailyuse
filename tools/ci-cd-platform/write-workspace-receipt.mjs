#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { buildProvenance, digest, validateWorkspaceReceipt } from './lib/contracts.mjs';

function commandVersion(command, args = ['--version']) {
  try {
    return execFileSync(command, args, { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

const receipt = {
  kind: 'workspace-receipt-v1',
  version: 1,
  commit: process.env.NX_HEAD ?? process.env.GITHUB_SHA ?? 'local',
  runner: {
    os: process.env.RUNNER_OS ?? process.platform,
    image: process.env.ImageOS ?? process.env.RUNNER_IMAGE ?? null,
    arch: process.arch,
    cpuCount: os.cpus().length,
  },
  toolchain: {
    node: process.version,
    pnpm: commandVersion(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'),
    python: commandVersion(process.platform === 'win32' ? 'python.exe' : 'python3'),
    uv: commandVersion(process.platform === 'win32' ? 'uv.exe' : 'uv'),
  },
  capabilities: (process.env.CI_CAPABILITIES ?? 'node,pnpm')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .sort(),
  cache: {
    pnpm: process.env.PNPM_CACHE_HIT ?? 'unknown',
    nx: process.env.NX_CACHE_HIT ?? 'unknown',
    playwright: process.env.PLAYWRIGHT_CACHE_HIT ?? 'unknown',
  },
  timing: {
    setupMs:
      Number.isFinite(Number(process.env.WORKSPACE_SETUP_STARTED_AT)) &&
      Number.isFinite(Number(process.env.WORKSPACE_SETUP_ENDED_AT))
        ? Math.max(
            0,
            Number(process.env.WORKSPACE_SETUP_ENDED_AT) -
              Number(process.env.WORKSPACE_SETUP_STARTED_AT),
          )
        : null,
  },
};
receipt.provenance = buildProvenance({
  generator: 'ci-cd-platform-v2/write-workspace-receipt@1',
  input: {
    commit: receipt.commit,
    toolchain: receipt.toolchain,
    capabilities: receipt.capabilities,
  },
});
receipt.digest = digest(receipt);
validateWorkspaceReceipt(receipt);

const output = path.resolve(
  process.env.WORKSPACE_RECEIPT_OUTPUT ?? 'reports/ci-cd-platform/workspace-receipt.json',
);
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(receipt, null, 2)}\n`);
if (process.env.GITHUB_OUTPUT) {
  await writeFile(
    process.env.GITHUB_OUTPUT,
    `workspace_receipt=${output}\nworkspace_receipt_digest=${receipt.digest}\n`,
    { flag: 'a' },
  );
}
console.log(
  JSON.stringify(
    {
      path: output,
      digest: receipt.digest,
      toolchain: receipt.toolchain,
      capabilities: receipt.capabilities,
    },
    null,
    2,
  ),
);
