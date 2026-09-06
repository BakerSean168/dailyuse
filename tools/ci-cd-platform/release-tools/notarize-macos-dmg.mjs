#!/usr/bin/env node

import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

export function createNotarytoolSubmitArgs({ dmg, keyPath, keyId, issuer }) {
  if (!dmg || !keyPath || !keyId || !issuer) {
    throw new Error(
      'DMG notarization requires dmg, APPLE_API_KEY, APPLE_API_KEY_ID and APPLE_API_ISSUER',
    );
  }
  return [
    'notarytool',
    'submit',
    dmg,
    '--key',
    keyPath,
    '--key-id',
    keyId,
    '--issuer',
    issuer,
    '--wait',
    '--output-format',
    'json',
  ];
}

export function validateNotarytoolResult(output) {
  let parsed;
  try {
    parsed = JSON.parse(output);
  } catch {
    throw new Error('notarytool did not return valid JSON evidence');
  }
  if (parsed?.status !== 'Accepted') {
    throw new Error(`DMG notarization was not accepted: ${parsed?.status ?? '<missing>'}`);
  }
  if (typeof parsed.id !== 'string' || parsed.id.length === 0) {
    throw new Error('notarytool Accepted result is missing submission id');
  }
  return { id: parsed.id, status: parsed.status };
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.slice(0, 2).join(' ')} failed (${result.status ?? 1}): ${`${stdout}\n${stderr}`.trim()}`,
    );
  }
  return stdout.trim();
}

async function findSingleDmg(root) {
  const dmgs = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.dmg'))
    .map((entry) => path.join(root, entry.name));
  if (dmgs.length !== 1) {
    throw new Error(`expected exactly one DMG under ${root}, found ${dmgs.length}`);
  }
  return dmgs[0];
}

async function main() {
  const [root] = process.argv.slice(2);
  if (!root) throw new Error('usage: notarize-macos-dmg.mjs <dist-root>');
  if (process.platform !== 'darwin') {
    throw new Error('DMG notarization must run on a macOS runner');
  }

  const dmg = await findSingleDmg(root);
  const args = createNotarytoolSubmitArgs({
    dmg,
    keyPath: process.env.APPLE_API_KEY ?? '',
    keyId: process.env.APPLE_API_KEY_ID ?? '',
    issuer: process.env.APPLE_API_ISSUER ?? '',
  });
  const evidence = validateNotarytoolResult(run('xcrun', args));
  run('xcrun', ['stapler', 'staple', '-v', dmg]);
  run('xcrun', ['stapler', 'validate', '-v', dmg]);
  console.log(`[notarize-macos-dmg] PASS ${path.basename(dmg)} submission=${evidence.id}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`[notarize-macos-dmg] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
