#!/usr/bin/env node

import { pathToFileURL } from 'node:url';
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const MACOS_MODES = new Set(['unsigned-pilot', 'signed-notarized']);

export function resolveDesktopSigningState({ os, matrixState, macosMode }) {
  if (os !== 'macos') {
    if (!matrixState || matrixState === 'macos-policy') {
      throw new Error(
        `non-macOS platform requires an explicit signing state, got ${matrixState ?? '<missing>'}`,
      );
    }
    return matrixState;
  }
  if (!MACOS_MODES.has(macosMode)) {
    throw new Error(`unsupported macOS signing mode: ${macosMode || '<missing>'}`);
  }
  return macosMode;
}

export function validateMacosSigningCredentials(credentials) {
  const required = [
    ['MACOS_CSC_LINK', credentials.cscLink],
    ['MACOS_APPLE_API_KEY_P8', credentials.appleApiKeyP8],
    ['MACOS_APPLE_API_KEY_ID', credentials.appleApiKeyId],
    ['MACOS_APPLE_API_ISSUER', credentials.appleApiIssuer],
  ];
  const missing = required.filter(([, value]) => !value).map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`signed-notarized mode requires protected secret(s): ${missing.join(', ')}`);
  }
  if (!credentials.appleApiKeyP8.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error(
      'MACOS_APPLE_API_KEY_P8 does not look like an App Store Connect API private key',
    );
  }
  if (!/^[A-Z0-9]{10}$/u.test(credentials.appleApiKeyId)) {
    throw new Error('MACOS_APPLE_API_KEY_ID must be a 10-character App Store Connect key ID');
  }
  if (!/^[0-9a-fA-F-]{36}$/u.test(credentials.appleApiIssuer)) {
    throw new Error('MACOS_APPLE_API_ISSUER must be an App Store Connect issuer UUID');
  }
}

async function appendOutput(file, name, value) {
  await appendFile(file, `${name}=${value}\n`);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'resolve') {
    const [os, matrixState, macosMode] = args;
    const signingState = resolveDesktopSigningState({ os, matrixState, macosMode });
    const output = process.env.GITHUB_OUTPUT;
    if (!output) throw new Error('GITHUB_OUTPUT is required');
    await appendOutput(output, 'signing_state', signingState);
    await appendOutput(output, 'signed_mode', String(signingState === 'signed-notarized'));
    return;
  }
  if (command === 'prepare') {
    const credentials = {
      cscLink: process.env.MACOS_CSC_LINK ?? '',
      appleApiKeyP8: process.env.MACOS_APPLE_API_KEY_P8 ?? '',
      appleApiKeyId: process.env.MACOS_APPLE_API_KEY_ID ?? '',
      appleApiIssuer: process.env.MACOS_APPLE_API_ISSUER ?? '',
    };
    validateMacosSigningCredentials(credentials);
    const runnerTemp = process.env.RUNNER_TEMP;
    const githubEnv = process.env.GITHUB_ENV;
    if (!runnerTemp || !githubEnv) throw new Error('RUNNER_TEMP and GITHUB_ENV are required');
    await mkdir(runnerTemp, { recursive: true });
    const keyPath = path.join(runnerTemp, `AuthKey_${credentials.appleApiKeyId}.p8`);
    await writeFile(keyPath, `${credentials.appleApiKeyP8.trim()}\n`, { mode: 0o600 });
    await appendOutput(githubEnv, 'APPLE_API_KEY', keyPath);
    await appendOutput(githubEnv, 'APPLE_API_KEY_ID', credentials.appleApiKeyId);
    await appendOutput(githubEnv, 'APPLE_API_ISSUER', credentials.appleApiIssuer);
    console.log(
      '[macos-signing-policy] protected signing credentials validated; App Store Connect key materialized in runner temp',
    );
    return;
  }
  throw new Error(
    'usage: macos-signing-policy.mjs resolve <os> <matrix-state> <macos-mode> | prepare',
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(
      `[macos-signing-policy] ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  });
}
