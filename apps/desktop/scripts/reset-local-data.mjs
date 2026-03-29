#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { resolveLikelyUserDataDirs } from './user-data-paths.mjs';

const WINDOW_STATE_PREFIX = 'window-state-';
const VALID_SCOPES = new Set(['all', 'auth', 'db']);

function collectTargets(userDataDir, scope) {
  const authDir = path.join(userDataDir, 'auth');
  const dataDir = path.join(userDataDir, 'data');
  const repositoryStorageDir = path.join(userDataDir, 'repository-storage');

  const targets = [];

  if (scope === 'all' || scope === 'auth') {
    targets.push({
      label: 'auth directory',
      path: authDir,
    });
  }

  if (scope === 'all' || scope === 'db') {
    targets.push(
      {
        label: 'database directory',
        path: dataDir,
      },
      {
        label: 'repository storage directory',
        path: repositoryStorageDir,
      },
    );
  }

  if ((scope === 'all' || scope === 'db') && fs.existsSync(userDataDir)) {
    for (const entry of fs.readdirSync(userDataDir, { withFileTypes: true })) {
      if (
        entry.isFile() &&
        entry.name.startsWith(WINDOW_STATE_PREFIX) &&
        entry.name.endsWith('.json')
      ) {
        targets.push({
          label: 'window state file',
          path: path.join(userDataDir, entry.name),
        });
      }
    }
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
