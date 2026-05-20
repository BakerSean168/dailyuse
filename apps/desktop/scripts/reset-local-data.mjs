#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { resolveLikelyUserDataDirs } from './user-data-paths.mjs';

const VALID_SCOPES = new Set(['all', 'auth', 'db']);

function collectTargets(userDataDir, scope) {
  const sharedAuthDir = path.join(userDataDir, 'shared', 'auth');
  const sharedProfilesDir = path.join(userDataDir, 'shared', 'profiles');
  const sharedUiDir = path.join(userDataDir, 'shared', 'ui');
  const profilesDir = path.join(userDataDir, 'profiles');
  const cacheDir = path.join(userDataDir, 'cache');

  const targets = [];

  if (scope === 'all' || scope === 'auth') {
    targets.push({
      label: 'shared auth directory',
      path: sharedAuthDir,
    });
  }

  if (scope === 'all' || scope === 'db') {
    targets.push(
      {
        label: 'shared profiles directory',
        path: sharedProfilesDir,
      },
      {
        label: 'shared ui directory',
        path: sharedUiDir,
      },
      {
        label: 'profiles directory',
        path: profilesDir,
      },
      {
        label: 'cache directory',
        path: cacheDir,
      },
    );
  }

  return targets;
}

function removeTarget(target, dryRun) {
  if (!fs.existsSync(target.path)) {
    return { ...target, status: 'missing' };
  }

  if (dryRun) {
    return { ...target, status: 'would_remove' };
  }

  fs.rmSync(target.path, { recursive: true, force: true });
  return { ...target, status: 'removed' };
}

function parseScope(argv) {
  const explicitScopeArg = argv.find((arg) => arg.startsWith('--scope='));
  const explicitScope = explicitScopeArg ? explicitScopeArg.slice('--scope='.length) : null;
  const positionalScope = argv.find((arg) => !arg.startsWith('--'));
  const scope = explicitScope ?? positionalScope ?? 'all';

  if (!VALID_SCOPES.has(scope)) {
    throw new Error(`Unsupported scope: ${scope}. Expected one of: all, auth, db`);
  }

  return scope;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const scope = parseScope(args);
  const userDataDirs = resolveLikelyUserDataDirs();

  console.log(`[local-data-reset] mode=${dryRun ? 'dry-run' : 'apply'} scope=${scope}`);

  let affected = 0;
  for (const userDataDir of userDataDirs) {
    console.log(`[local-data-reset] scanning: ${userDataDir}`);
    const targets = collectTargets(userDataDir, scope);
    const results = targets.map((target) => removeTarget(target, dryRun));

    for (const result of results) {
      if (result.status === 'removed' || result.status === 'would_remove') {
        affected += 1;
      }
      console.log(`[local-data-reset] ${result.status}: ${result.path} (${result.label})`);
    }
  }

  console.log(`[local-data-reset] done, affected targets: ${affected}`);
  if (affected === 0) {
    console.log('[local-data-reset] no local desktop data found in default userData locations');
  }
}

main();
