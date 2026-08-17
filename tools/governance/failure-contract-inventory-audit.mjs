#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { collectSourceFiles } from './lib/source-scan.mjs';
import {
  evaluateFailureContractInventory,
  fingerprintFailureFindings,
  scanFailureContractSource,
} from './lib/failure-contract-inventory.mjs';

const ROOT = process.cwd();
const BASELINE_PATH = path.join(ROOT, 'tools/governance/failure-contract-baseline.json');
const args = process.argv.slice(2);
const writeBaseline = args.includes('--write-baseline');
const jsonIndex = args.indexOf('--json');
const jsonPath = jsonIndex >= 0 ? args[jsonIndex + 1] : undefined;

function readBaseline() {
  if (!existsSync(BASELINE_PATH)) {
    return { version: 1, description: 'MemoFlow failure-contract legacy baseline', entries: {} };
  }
  return JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
}

function collectFindings() {
  const sourceFiles = [
    ...collectSourceFiles(path.join(ROOT, 'apps'), ROOT),
    ...collectSourceFiles(path.join(ROOT, 'packages'), ROOT),
  ];
  const findings = [];
  for (const file of sourceFiles) {
    const content = readFileSync(file.absPath, 'utf8');
    findings.push(...scanFailureContractSource(content, file.relPath));
  }
  return fingerprintFailureFindings(findings);
}

function summarize(findings) {
  const counts = new Map();
  for (const finding of findings) {
    counts.set(finding.ruleId, (counts.get(finding.ruleId) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function printFindings(title, findings) {
  if (findings.length === 0) return;
  console.error(`\n${title} (${findings.length})`);
  for (const finding of findings) {
    console.error(
      `  - ${finding.ruleId} ${finding.file}:${finding.line}:${finding.column} ${finding.snippet}`,
    );
  }
}

const findings = collectFindings();
const summary = summarize(findings);

if (jsonPath) {
  const outputPath = path.resolve(ROOT, jsonPath);
  writeFileSync(
    outputPath,
    `${JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), summary, findings }, null, 2)}\n`,
  );
}

if (writeBaseline) {
  const existing = readBaseline();
  const entries = {};
  for (const finding of findings) {
    const previous = existing.entries?.[finding.fingerprint];
    entries[finding.fingerprint] = {
      ruleId: finding.ruleId,
      file: finding.file,
      snippet: finding.snippet,
      owner: previous?.owner ?? 'application-contract-refactor',
      reason: previous?.reason ?? 'Historical production finding captured by ACR-001',
      retireBy: previous?.retireBy ?? '2026-12-31',
    };
  }
  writeFileSync(
    BASELINE_PATH,
    `${JSON.stringify(
      {
        version: 1,
        description:
          'Owned, expiring legacy findings. New findings fail immediately; stale entries must be removed.',
        entries,
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    `[failure-contract-inventory] wrote ${findings.length} finding(s) to ${path.relative(ROOT, BASELINE_PATH)}`,
  );
  console.log(`[failure-contract-inventory] summary ${JSON.stringify(summary)}`);
  process.exit(0);
}

if (!existsSync(BASELINE_PATH)) {
  console.error('[failure-contract-inventory] missing baseline; run with --write-baseline');
  process.exit(1);
}

const evaluation = evaluateFailureContractInventory(findings, readBaseline());
console.log(
  `[failure-contract-inventory] ${findings.length} current finding(s); ${evaluation.staleEntries.length} retired baseline entry/entries`,
);
console.log(`[failure-contract-inventory] summary ${JSON.stringify(summary)}`);

printFindings('New failure-contract violations', evaluation.newFindings);
printFindings('Expired failure-contract violations', evaluation.expiredFindings);

if (evaluation.staleEntries.length > 0) {
  console.warn(
    `[failure-contract-inventory] ${evaluation.staleEntries.length} stale baseline entry/entries can be removed`,
  );
}

if (evaluation.newFindings.length > 0 || evaluation.expiredFindings.length > 0) {
  process.exit(1);
}

console.log('[failure-contract-inventory] passed (no new or expired production findings).');
