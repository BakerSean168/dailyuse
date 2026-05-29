#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..', '..');
const GOVERNANCE_SRC = path.join(ROOT, 'packages', 'governance', 'src');
const SOURCE_EXTENSIONS = new Set(['.ts']);
const EXCLUDED_FILE_PATTERNS = [
  /(^|[/\\])index\.ts$/,
  /\.(spec|test)\.ts$/,
];

const audited = [];
const violations = [];

walk(GOVERNANCE_SRC);

if (violations.length > 0) {
  console.error(`[governance-module-docs-audit] failed with ${violations.length} issue(s):`);
  for (const violation of violations) {
    console.error(`  - ${violation}`);
  }
  process.exit(1);
}

console.log(`[governance-module-docs-audit] passed. audited ${audited.length} file(s).`);

function walk(currentPath) {
  for (const entry of readdirSync(currentPath, { withFileTypes: true })) {
    const fullPath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    auditFile(fullPath);
  }
}

function auditFile(fullPath) {
  const relativePath = toRelative(fullPath);
  if (!SOURCE_EXTENSIONS.has(path.extname(relativePath))) {
    return;
  }
  if (EXCLUDED_FILE_PATTERNS.some((pattern) => pattern.test(relativePath))) {
    return;
  }

  audited.push(relativePath);
  const content = readFileSync(fullPath, 'utf8').replace(/^\uFEFF/, '');
  const normalized = content.replace(/^(?:\s|\/\/.*(?:\r?\n|$))*/, '');

  if (!normalized.startsWith('/**')) {
    violations.push(`${relativePath} 缺少文件级顶层 JSDoc。`);
  }
}

function toRelative(fullPath) {
  return path.relative(ROOT, fullPath).replaceAll('\\', '/');
}
