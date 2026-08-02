#!/usr/bin/env node
/**
 * ADR-038 / W1: Reka UI is the single primitive implementation.
 *
 * Rules:
 * - radix-vue must not be imported or declared as a package dependency.
 * - reka-ui may only be imported by the shared UI primitive implementation.
 * - application modules consume @memoflow/ui-vue-shadcn instead of the vendor.
 * - Switch and Checkbox consumers use Reka's modelValue contract, never the retired checked API.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const primitivePrefix = 'packages/ui-vue-shadcn/src/components/ui/';
const vendorImportPattern = /(?:from\s+|import\s*\(|require\(\s*)['"](radix-vue|reka-ui)['"]/g;

function walk(directory, output = []) {
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    return output;
  }

  for (const entry of entries) {
    if (
      entry.name === 'node_modules' ||
      entry.name === 'dist' ||
      entry.name === 'dist-electron' ||
      entry.name === 'dist-renderer' ||
      entry.name === 'build' ||
      entry.name === 'coverage' ||
      entry.name === '.git' ||
      entry.name === '.nx'
    ) {
      continue;
    }

    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, output);
    } else if (/\.(ts|tsx|js|mjs|cjs|vue)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      output.push(fullPath);
    }
  }

  return output;
}

const offenders = [];
for (const scanRoot of [join(root, 'packages'), join(root, 'apps')]) {
  for (const file of walk(scanRoot)) {
    const source = readFileSync(file, 'utf8');
    const relativePath = relative(root, file).replace(/\\/g, '/');

    for (const match of source.matchAll(vendorImportPattern)) {
      const vendor = match[1];
      if (vendor === 'radix-vue') {
        offenders.push(`${relativePath}: forbidden radix-vue import`);
      } else if (!relativePath.startsWith(primitivePrefix)) {
        offenders.push(`${relativePath}: reka-ui import outside shared primitive implementation`);
      }
    }

    if (
      relativePath.endsWith('.vue') &&
      /<(?:Switch|Checkbox)\b[^>]*(?::checked|v-model:checked|@update:checked)\s*=/s.test(source)
    ) {
      offenders.push(`${relativePath}: obsolete Switch/Checkbox checked binding`);
    }
  }
}

for (const manifestPath of walkPackageManifests(root)) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  for (const section of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    if (manifest[section]?.['radix-vue']) {
      offenders.push(
        `${relative(root, manifestPath).replace(/\\/g, '/')}: forbidden radix-vue ${section} entry`,
      );
    }
  }
}

if (offenders.length > 0) {
  console.error('[reka-ui-primitive-audit] FAIL: primitive vendor Interface is not canonical:');
  for (const offender of offenders) console.error('  -', offender);
  process.exit(1);
}

console.log('[reka-ui-primitive-audit] OK: Reka UI is isolated to the shared primitive Module.');

function walkPackageManifests(directory, output = []) {
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    return output;
  }

  for (const entry of entries) {
    if (
      entry.name === 'node_modules' ||
      entry.name === 'dist' ||
      entry.name === 'dist-electron' ||
      entry.name === 'dist-renderer' ||
      entry.name === 'build' ||
      entry.name === 'coverage' ||
      entry.name === '.git' ||
      entry.name === '.nx'
    ) {
      continue;
    }
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) walkPackageManifests(fullPath, output);
    else if (entry.name === 'package.json') output.push(fullPath);
  }

  return output;
}
