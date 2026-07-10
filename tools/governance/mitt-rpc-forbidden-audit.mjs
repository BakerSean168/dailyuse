#!/usr/bin/env node

/**
 * mitt-RPC Forbidden Audit (CLI)
 *
 * Fails if business code calls `eventBus.invoke(` / `eventBus.handle(`.
 * See ADR-033 and tools/governance/lib/mitt-rpc-forbidden.mjs for rationale.
 *
 * Exit codes:
 *   0 - no mitt-RPC usage in audited scope
 *   1 - mitt-RPC usage detected
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { collectSourceFiles } from './lib/source-scan.mjs';
import { findMittRpcViolations, formatMittRpcViolation } from './lib/mitt-rpc-forbidden.mjs';

const ROOT = path.join(import.meta.dirname, '..', '..');
const SCAN_ROOTS = [path.join(ROOT, 'apps'), path.join(ROOT, 'packages')];

const files = SCAN_ROOTS.flatMap((scanRoot) => collectSourceFiles(scanRoot, ROOT)).map(
  ({ relPath, absPath }) => ({ relPath, content: readFileSync(absPath, 'utf-8') }),
);

const { violations, auditedFiles, exemptHits } = findMittRpcViolations(files);

if (violations.length > 0) {
  console.error(`[mitt-rpc-forbidden-audit] failed with ${violations.length} issue(s):`);
  for (const violation of violations) {
    console.error(`  ${formatMittRpcViolation(violation)}`);
  }
  process.exit(1);
}

console.log(
  `[mitt-rpc-forbidden-audit] passed (${auditedFiles} files audited, ${exemptHits} exempt hit(s))`,
);
