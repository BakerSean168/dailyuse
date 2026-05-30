#!/usr/bin/env node
/**
 * Package Export Audit
 *
 * Ensures feature package root barrels do not re-export concrete infrastructure
 * adapters or use `export * from './infrastructure-server'` which exposes
 * implementation classes. Allowed exports from root:
 *  - contracts (types)
 *  - domain-shared
 *  - createXModule composition roots
 *  - stable type aliases
 *
 * Flags:
 *  - `export * from './infrastructure-server'` in root index.ts
 *  - export of names ending with Prisma|PowerSync|Adapter|Repository from infra
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..', '..');
const PACKAGES = path.join(ROOT, 'packages');

const infraForbiddenNameRegex = /(Prisma|PowerSync|Adapter|Repository)$/;

function main() {
  const pkgs = readdirSync(PACKAGES, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const violations = [];

  for (const pkg of pkgs) {
    const indexPath = path.join(PACKAGES, pkg, 'src', 'index.ts');
    if (!existsSync(indexPath)) continue;
    const content = readFileSync(indexPath, 'utf8');
    const rel = path.relative(ROOT, indexPath).replaceAll('\\', '/');

    // 1. forbid export * from './infrastructure-server'
    if (/export\s*\*\s*from\s+['"]\.\/infrastructure-server['"]/m.test(content)) {
      violations.push(`${rel} root barrel must not use "export * from './infrastructure-server'"`);
    }

    // 2. detect named exports that re-export infra concrete classes
    // match: export { X, Y } from './infrastructure-server';
    const namedExportPattern = /export\s*\{([^}]+)\}\s*from\s+['"]\.\/infrastructure-server['"]/gm;
    let m;
    while ((m = namedExportPattern.exec(content)) !== null) {
      const names = m[1].split(',').map((s) => s.trim());
      for (const n of names) {
        if (infraForbiddenNameRegex.test(n) && !/^create/i.test(n)) {
          violations.push(`${rel} re-exports infra concrete '${n}' from infrastructure-server (forbidden)`);
        }
      }
    }
  }

  if (violations.length > 0) {
    console.error('❌ Package Export Audit FAILED');
    for (const v of violations) {
      console.error(`  - ${v}`);
    }
    process.exit(1);
  }

  console.log('✅ Package Export Audit passed');
}

main();
