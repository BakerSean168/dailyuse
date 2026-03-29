#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { resolveLikelyUserDataDirs } from './user-data-paths.mjs';

const DB_FILE = 'dailyuse-sync.sqlite';
const DB_DIR_NAME = 'data';

function collectDbCandidates() {
  const dirs = resolveLikelyUserDataDirs();
  const files = [];

  for (const userDataDir of dirs) {
    const dataDir = path.join(userDataDir, DB_DIR_NAME);
    const primary = path.join(dataDir, DB_FILE);
    const wal = `${primary}-wal`;
    const shm = `${primary}-shm`;
    files.push(primary, wal, shm);
  }

  return [...new Set(files)];
}

function removeIfExists(filePath, dryRun) {
  if (!fs.existsSync(filePath)) {
    return { path: filePath, status: 'missing' };
  }

  if (dryRun) {
    return { path: filePath, status: 'would_remove' };
  }

  fs.rmSync(filePath, { force: true });
  return { path: filePath, status: 'removed' };
}

function main() {
  const dryRun = process.argv.includes('--dry-run');

  const candidates = collectDbCandidates();
  const results = candidates.map((p) => removeIfExists(p, dryRun));

  console.log(`[db-reset] mode=${dryRun ? 'dry-run' : 'apply'}`);
  for (const r of results) {
    console.log(`[db-reset] ${r.status}: ${r.path}`);
  }

  const affected = results.filter(
    (r) => r.status === 'removed' || r.status === 'would_remove',
  ).length;
  console.log(`[db-reset] done, affected files: ${affected}`);

  if (affected === 0) {
    console.log('[db-reset] no local DB files found in default userData locations');
  }
}

main();
