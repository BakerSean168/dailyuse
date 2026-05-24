#!/usr/bin/env node

import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..', '..');
const SCOPE_DIRECTORIES = ['apps', 'packages'];
const SKIP_DIRECTORIES = new Set([
  '.git',
  '.nx',
  'build',
  'coverage',
  'dist',
  'dist-electron',
  'dist-renderer',
  'node_modules',
]);
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.py', '.ts', '.tsx', '.vue']);
const EXCLUDED_SEGMENTS = new Set([
  '__mocks__',
  '__snapshots__',
  '__stories__',
  '__tests__',
  'assets',
  'docs',
  'e2e',
  'generated',
  'locales',
  'test',
  'tests',
]);
const COMPONENT_DIRECTORY_SEGMENTS = new Set([
  'cards',
  'components',
  'dialogs',
  'page-objects',
  'screens',
  'views',
  'widgets',
]);
const HOOK_DIRECTORY_SEGMENTS = new Set(['composables', 'hooks']);

const errors = [];
const audited = [];

walkScope();

if (errors.length > 0) {
  console.error(`[file-naming-audit] failed with ${errors.length} issue(s):`);
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(`[file-naming-audit] passed. audited ${audited.length} file(s).`);

function walkScope() {
  for (const scopeDir of SCOPE_DIRECTORIES) {
    walk(path.join(ROOT, scopeDir));
  }
}

function walk(currentPath) {
  let entries;
  try {
    entries = readdirSync(currentPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (SKIP_DIRECTORIES.has(entry.name)) {
      continue;
    }

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
  const extension = path.extname(relativePath);
  if (!SOURCE_EXTENSIONS.has(extension)) {
    return;
  }

  const normalized = relativePath.replaceAll('\\', '/');
  const segments = normalized.split('/');

  if (!isInSourceTree(segments)) {
    return;
  }
  if (segments.some((segment) => EXCLUDED_SEGMENTS.has(segment))) {
    return;
  }

  const fileName = path.basename(normalized);
  if (isDeclarationFile(fileName)) {
    return;
  }
  if (isTestSupportFile(fileName)) {
    return;
  }
  if (isFrameworkReservedFile(fileName)) {
    return;
  }

  const stem = getStem(fileName);
  const expectedStyle = getExpectedStyle(segments, extension, stem);
  if (expectedStyle === 'ignore') {
    return;
  }

  audited.push(relativePath);
  if (!matchesStyle(stem, expectedStyle)) {
    errors.push(`${relativePath} 应为 ${expectedStyle} 命名，当前文件名为 "${fileName}"。`);
  }
}

function isInSourceTree(segments) {
  if (segments.length < 3) {
    return false;
  }

  const [scope, , third] = segments;
  return (scope === 'apps' || scope === 'packages') && third === 'src';
}

function isDeclarationFile(fileName) {
  return fileName.endsWith('.d.ts');
}

function isFrameworkReservedFile(fileName) {
  if (fileName === '__init__.py') {
    return true;
  }
  if (fileName === '_layout.tsx') {
    return true;
  }
  return /^\[[^/\\]+\]\.tsx$/.test(fileName);
}

function isTestSupportFile(fileName) {
  return (
    fileName === 'index.ts' ||
    fileName === 'index.tsx' ||
    fileName.endsWith('.spec.ts') ||
    fileName.endsWith('.spec.tsx') ||
    fileName.endsWith('.test.ts') ||
    fileName.endsWith('.test.tsx') ||
    fileName.endsWith('.stories.ts') ||
    fileName.endsWith('.stories.tsx')
  );
}

function getStem(fileName) {
  if (fileName.endsWith('.d.ts')) {
    return fileName.slice(0, -'.d.ts'.length);
  }

  const parts = fileName.split('.');
  if (parts.length === 1) {
    return parts[0];
  }

  return parts[0];
}

function getExpectedStyle(segments, extension, stem) {
  if (extension === '.py') {
    return 'snake_case';
  }

  if (segments.includes('app') && segments[0] === 'apps' && segments[1] === 'mobile') {
    return 'ignore';
  }

  if (segments.some((segment) => HOOK_DIRECTORY_SEGMENTS.has(segment))) {
    return 'camelCase';
  }

  if (
    segments.some((segment) => COMPONENT_DIRECTORY_SEGMENTS.has(segment)) &&
    (extension === '.vue' || extension === '.tsx' || extension === '.jsx')
  ) {
    return 'PascalCase';
  }

  if (extension === '.vue') {
    return 'PascalCase';
  }

  if (/^use[A-Z]/.test(stem)) {
    return 'camelCase';
  }

  if (extension === '.tsx' && isPascalCase(stem)) {
    return 'PascalCase';
  }

  return 'kebab-case';
}

function matchesStyle(stem, expectedStyle) {
  if (expectedStyle === 'kebab-case') {
    return isKebabCase(stem);
  }
  if (expectedStyle === 'PascalCase') {
    return isPascalCase(stem);
  }
  if (expectedStyle === 'camelCase') {
    return isCamelCase(stem);
  }
  if (expectedStyle === 'snake_case') {
    return isSnakeCase(stem);
  }
  return true;
}

function isKebabCase(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function isPascalCase(value) {
  return /^[A-Z][A-Za-z0-9]*$/.test(value);
}

function isCamelCase(value) {
  return /^[a-z][A-Za-z0-9]*$/.test(value);
}

function isSnakeCase(value) {
  return /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(value);
}

function toRelative(fullPath) {
  return path.relative(ROOT, fullPath) || '.';
}
