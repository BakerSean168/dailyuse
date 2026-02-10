#!/usr/bin/env node
/**
 * Add new module packages as workspace dependencies to old layered packages
 * so they can properly re-export.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const NEW_PACKAGES = ['goal', 'task', 'repository', 'editor', 'reminder', 'notification', 'schedule', 'setting'];

// Old packages that need to depend on the new packages
const OLD_PACKAGES = [
  'domain-shared',
  'domain-server',
  'domain-client',
  'application-server',
  'application-client',
  'infrastructure-server',
  'infrastructure-client',
];

// editor is missing from some packages
const EDITOR_SKIP = ['application-client', 'infrastructure-client'];

for (const oldPkg of OLD_PACKAGES) {
  const pkgJsonPath = path.join(ROOT, 'packages', oldPkg, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    console.log(`[SKIP] ${pkgJsonPath} not found`);
    continue;
  }

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
  
  if (!pkgJson.dependencies) {
    pkgJson.dependencies = {};
  }

  for (const newPkg of NEW_PACKAGES) {
    if (EDITOR_SKIP.includes(oldPkg) && newPkg === 'editor') continue;
    pkgJson.dependencies[`@dailyuse/${newPkg}`] = 'workspace:*';
  }

  // Sort dependencies
  const sorted = {};
  for (const key of Object.keys(pkgJson.dependencies).sort()) {
    sorted[key] = pkgJson.dependencies[key];
  }
  pkgJson.dependencies = sorted;

  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
  console.log(`[OK] ${oldPkg}/package.json updated`);
}

console.log('\n=== Dependencies added ===');
