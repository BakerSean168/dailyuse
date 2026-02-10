#!/usr/bin/env node
/**
 * Script to extract 8 modules (goal, task, repository, editor, reminder, notification, schedule, setting)
 * from the layered packages into separate vertical-slice packages, following the account/authentication pattern.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const MODULES = ['goal', 'task', 'repository', 'editor', 'reminder', 'notification', 'schedule', 'setting'];

// Layers to copy from existing packages
const LAYERS = [
  { src: 'packages/domain-shared/src', layer: 'domain-shared' },
  { src: 'packages/domain-server/src', layer: 'domain-server' },
  { src: 'packages/domain-client/src', layer: 'domain-client' },
  { src: 'packages/application-server/src', layer: 'application-server' },
  { src: 'packages/application-client/src', layer: 'application-client' },
  { src: 'packages/infrastructure-server/src', layer: 'infrastructure-server' },
  { src: 'packages/infrastructure-client/src', layer: 'infrastructure-client' },
];

// editor module is missing from application-client and infrastructure-client
const SKIP_LAYERS = {
  editor: ['application-client', 'infrastructure-client'],
};

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return false;

  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  return true;
}

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      count += countFiles(path.join(dir, entry.name));
    } else {
      count++;
    }
  }
  return count;
}

// Step 1: Copy source files for each module
console.log('=== Step 1: Copying source files ===\n');

for (const mod of MODULES) {
  const pkgDir = path.join(ROOT, 'packages', mod);
  const srcDir = path.join(pkgDir, 'src');
  console.log(`\n--- Module: ${mod} ---`);

  // Copy each layer
  for (const { src, layer } of LAYERS) {
    const skipLayers = SKIP_LAYERS[mod] || [];
    if (skipLayers.includes(layer)) {
      console.log(`  [SKIP] ${layer} (not applicable for ${mod})`);
      continue;
    }

    const srcPath = path.join(ROOT, src, mod);
    const destPath = path.join(srcDir, layer);

    if (fs.existsSync(srcPath)) {
      const fileCount = countFiles(srcPath);
      copyDirRecursive(srcPath, destPath);
      console.log(`  [OK] ${layer}: ${fileCount} files copied from ${src}/${mod}`);
    } else {
      console.log(`  [SKIP] ${layer}: source not found at ${src}/${mod}`);
    }
  }
}

console.log('\n=== Step 1 Complete ===\n');
console.log('Files have been copied. Now creating package configurations...\n');
