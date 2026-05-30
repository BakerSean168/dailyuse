#!/usr/bin/env node

/**
 * Governance Module Docs Audit
 *
 * Validates that every .ts source file in packages/governance/src/ has
 * meaningful JSDoc documentation — not just a file header, but content
 * that explains responsibility, layer placement, and public API contracts.
 *
 * Checks:
 *  1. File-level JSDoc exists and has substantive content (≥3 non-empty description lines)
 *  2. Infrastructure adapter files are marked @internal
 *  3. Public exported classes/functions have JSDoc blocks
 *
 * Excludes: index.ts barrel files, test files (*.spec.ts, *.test.ts)
 */

import { readdirSync, readFileSync } from 'node:fs';
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
    if (!entry.isFile()) continue;
    auditFile(fullPath);
  }
}

function auditFile(fullPath) {
  const relativePath = toRelative(fullPath);
  if (!SOURCE_EXTENSIONS.has(path.extname(relativePath))) return;
  if (EXCLUDED_FILE_PATTERNS.some((pattern) => pattern.test(relativePath))) return;

  audited.push(relativePath);
  const content = readFileSync(fullPath, 'utf8').replace(/^﻿/, '');

  // 1. Check file-level JSDoc exists and has substance
  const fileJsdoc = extractFirstJsdoc(content);
  if (!fileJsdoc) {
    violations.push(`${relativePath} 缺少文件级顶层 JSDoc。`);
    return;
  }

  const meaningfulLines = countMeaningfulLines(fileJsdoc);
  if (meaningfulLines < 3) {
    violations.push(
      `${relativePath} 文件级 JSDoc 内容过少（${meaningfulLines} 行有效内容，最少需要 3 行）。请添加职责说明。`
    );
  }

  // Bilingual consistency: English first, Chinese second (heuristic)
  const hasEnglish = /[A-Za-z]{3,}/.test(fileJsdoc);
  const hasChinese = /[\u4e00-\u9fff]/.test(fileJsdoc);
  if (!(hasEnglish && hasChinese)) {
    violations.push(`${relativePath} 文件级 JSDoc 应同时包含 English (优先) 与 中文 (其次) 的说明。`);
  } else {
    const firstEnglish = fileJsdoc.search(/[A-Za-z]{3,}/);
    const firstChinese = fileJsdoc.search(/[\u4e00-\u9fff]/);
    if (firstChinese !== -1 && firstEnglish !== -1 && firstChinese < firstEnglish) {
      violations.push(`${relativePath} 文件级 JSDoc 应为 English first / 中文 second 的结构。`);
    }
  }

  // 2. Infrastructure adapter files must be marked @internal
  if (isInfrastructureAdapter(relativePath)) {
    if (!fileJsdoc.includes('@internal')) {
      violations.push(
        `${relativePath} 基础设施适配器文件必须在 JSDoc 中标注 @internal。`
      );
    }
  }

  // 3. Check public exported classes/functions have JSDoc
  checkPublicExportsHaveJsdoc(content, relativePath);
}

/**
 * Extract the first JSDoc block from source content.
 * Returns the block content (between /** and *\/) or null.
 */
function extractFirstJsdoc(content) {
  // Strip leading whitespace and line comments
  const normalized = content.replace(/^(?:\s|\/\/.*(?:\r?\n|$))*/, '');
  if (!normalized.startsWith('/**')) return null;

  const endIdx = normalized.indexOf('*/', 2);
  if (endIdx === -1) return null;

  return normalized.slice(0, endIdx + 2);
}

/**
 * Count meaningful (non-empty, non-decoration) lines in a JSDoc block.
 * Excludes the opening /**, closing *\/, and lines that are only * or empty.
 */
function countMeaningfulLines(jsdoc) {
  const lines = jsdoc.split(/\r?\n/);
  let count = 0;
  for (const line of lines) {
    const stripped = line.replace(/^\s*\*\s?/, '').trim();
    // Skip empty lines, opening /**, closing */
    if (!stripped) continue;
    if (stripped === '/**' || stripped === '*/') continue;
    if (stripped.startsWith('@see')) continue; // references don't count as description
    count++;
  }
  return count;
}

/**
 * Check if a file path is an infrastructure adapter (should be @internal).
 * Matches: infrastructure-server/adapters/**
 */
function isInfrastructureAdapter(relativePath) {
  return (
    relativePath.includes('/infrastructure-server/adapters/') &&
    !relativePath.includes('__tests__')
  );
}

/**
 * Check that public exported classes and functions have JSDoc blocks.
 * Only checks top-level exports (not re-exports from barrels).
 */
function checkPublicExportsHaveJsdoc(content, relativePath) {
  const exportPattern = /^export\s+(?:abstract\s+)?(?:class|function|async\s+function)\s+(\w+)/gm;
  let match;
  while ((match = exportPattern.exec(content)) !== null) {
    const name = match[1];
    const beforeMatch = content.slice(0, match.index);
    const trimmedBefore = beforeMatch.trimEnd();
    if (!trimmedBefore.endsWith('*/')) {
      violations.push(`${relativePath} 公开导出 '${name}' 缺少 JSDoc 注释。`);
      continue;
    }

    // Extract the JSDoc block immediately before the export
    const jsdocStart = trimmedBefore.lastIndexOf('/**');
    const jsdoc = jsdocStart !== -1 ? trimmedBefore.slice(jsdocStart) : '';

    // Determine if this is a function or class by inspecting the token after 'export '
    const tokenSlice = content.slice(match.index, match.index + 256);
    if (/^export\s+(?:abstract\s+)?class\b/.test(tokenSlice)) {
      // For classes, try to find constructor params and require @param in the file JSDoc or near constructor
      const classBodyStart = content.indexOf('{', match.index);
      const classBodySnippet = classBodyStart === -1 ? '' : content.slice(classBodyStart, classBodyStart + 2000);
      const ctorMatch = classBodySnippet.match(/constructor\s*\(([^)]*)\)/);
      if (ctorMatch && ctorMatch[1].trim() && !/(@param\b)/.test(jsdoc)) {
        violations.push(`${relativePath} 导出类 '${name}' 的 JSDoc 缺少 constructor 参数的 @param 标注（未检测到 @param）。`);
      }
    } else {
      // function
      const funcSigMatch = tokenSlice.match(/^(?:export\s+(?:async\s+)?function\s+\w+\s*)\(([^)]*)\)/m) || tokenSlice.match(/\(([^)]*)\)\s*=>/m);
      const params = funcSigMatch ? funcSigMatch[1].trim() : '';
      if (params && !/(@param\b)/.test(jsdoc)) {
        violations.push(`${relativePath} 导出函数 '${name}' 的 JSDoc 缺少 @param 标注。`);
      }

      // Check for return usage in a heuristic window after the export
      const windowBody = content.slice(match.index, match.index + 2000);
      if (/\breturn\b/.test(windowBody) && !/(@returns?\b)/.test(jsdoc)) {
        violations.push(`${relativePath} 导出函数 '${name}' 的 JSDoc 缺少 @returns 标注。`);
      }
    }
  }
}

function toRelative(fullPath) {
  return path.relative(ROOT, fullPath).replaceAll('\\', '/');
}
