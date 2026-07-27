#!/usr/bin/env node
/**
 * ADR-037: business date-fns importers must be ⊆ packages/time/src/engine/**
 * plus any path listed as kind:legacy in tools/governance/time-registry.json
 * that still imports date-fns (registry is the allowlist source of truth).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const registryPath = join(root, 'tools/governance/time-registry.json');
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));

const DATE_FNS_RE = /from\s+['"]date-fns(?:\/[^'"]*)?['"]|require\(\s*['"]date-fns/;

const ENGINE_PREFIX = 'packages/time/src/engine/';

/** Exact file paths allowed as legacy date-fns importers (from registry). */
const legacyAllow = new Set();
for (const entry of registry.entries ?? []) {
  if (entry.kind !== 'legacy' || typeof entry.path !== 'string') continue;
  const p = entry.path.replace(/\\/g, '/');
  // Only exact files are allowlisted; globs are not silent free-passes.
  if (!p.includes('*')) {
    legacyAllow.add(p);
  }
}

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    if (
      ent.name === 'node_modules' ||
      ent.name === 'dist' ||
      ent.name === 'dist-electron' ||
      ent.name === 'dist-renderer' ||
      ent.name === 'build' ||
      ent.name === 'coverage' ||
      ent.name === '.git' ||
      ent.name === '.nx'
    ) {
      continue;
    }
    const full = join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|mjs|cjs|vue)$/.test(ent.name) && !ent.name.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
}

const scanRoots = [join(root, 'packages'), join(root, 'apps')];
const offenders = [];

for (const scanRoot of scanRoots) {
  for (const file of walk(scanRoot)) {
    const rel = relative(root, file).replace(/\\/g, '/');
    if (rel.startsWith(ENGINE_PREFIX)) continue;
    // Legacy allowlist only if the file still imports date-fns (documented temporary).
    if (legacyAllow.has(rel)) continue;
    if (rel.includes('/__tests__/') || /\.(test|spec)\./.test(rel)) continue;
    const src = readFileSync(file, 'utf8');
    if (DATE_FNS_RE.test(src)) {
      offenders.push(rel);
    }
  }
}

if (offenders.length) {
  console.error('[date-fns-import-audit] FAIL: date-fns imports outside engine + legacy allowlist:');
  for (const o of offenders) console.error('  -', o);
  console.error(
    'Fix: migrate to @dailyuse/time, or register legacy in tools/governance/time-registry.json with retire_by.',
  );
  process.exit(1);
}

console.log('[date-fns-import-audit] OK: no illicit date-fns importers.');
process.exit(0);
