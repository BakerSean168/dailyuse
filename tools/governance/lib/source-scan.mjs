/**
 * Shared source-tree scanning helpers for governance audits.
 *
 * Pure, dependency-free utilities extracted so audit logic can be unit-tested
 * without touching the filesystem or process.exit. CLI wrappers pass real
 * directories; tests pass fixtures.
 */

import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

export const DEFAULT_SKIP_DIRS = new Set([
  '.git',
  '.nx',
  'node_modules',
  'dist',
  'build',
  'coverage',
  'generated',
  'locales',
  '__tests__',
  '__mocks__',
  'test',
  'tests',
  'e2e',
]);

export const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

/**
 * Recursively collect source files under `rootDir`.
 * Returns `{ absPath, relPath }` where relPath is forward-slash relative to `repoRoot`.
 */
export function collectSourceFiles(rootDir, repoRoot, options = {}) {
  const skipDirs = options.skipDirs ?? DEFAULT_SKIP_DIRS;
  const extensions = options.extensions ?? SOURCE_EXTENSIONS;
  const results = [];

  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (skipDirs.has(entry)) continue;
      const abs = path.join(dir, entry);
      let stat;
      try {
        stat = statSync(abs);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        walk(abs);
      } else if (stat.isFile() && extensions.has(path.extname(entry))) {
        results.push({
          absPath: abs,
          relPath: path.relative(repoRoot, abs).split(path.sep).join('/'),
        });
      }
    }
  };

  walk(rootDir);
  return results;
}

/**
 * Strip `//` line comments and `/* *\/` block comments from a single line,
 * threading block-comment state across lines via the returned `inBlockComment`.
 * Used so audits match real code, not commented-out examples.
 */
export function stripCommentsStateful(line, inBlockComment) {
  let result = '';
  let cursor = 0;
  let block = inBlockComment;

  while (cursor < line.length) {
    if (block) {
      const end = line.indexOf('*/', cursor);
      if (end === -1) return { code: result, inBlockComment: true };
      cursor = end + 2;
      block = false;
      continue;
    }
    if (line.startsWith('/*', cursor)) {
      block = true;
      cursor += 2;
      continue;
    }
    if (line.startsWith('//', cursor)) {
      return { code: result, inBlockComment: false };
    }
    result += line[cursor];
    cursor += 1;
  }

  return { code: result, inBlockComment: block };
}

/**
 * Scan file content line-by-line for `pattern`, skipping comments.
 * Returns matches as `{ line, column, method, text }`.
 * `pattern` must expose a capturing group #1 for the matched method when relevant.
 */
export function findPatternMatches(content, pattern) {
  const lines = content.split(/\r?\n/);
  const matches = [];
  let inBlockComment = false;

  for (let index = 0; index < lines.length; index += 1) {
    const { code, inBlockComment: next } = stripCommentsStateful(lines[index], inBlockComment);
    inBlockComment = next;
    const match = code.match(pattern);
    if (match) {
      matches.push({
        line: index + 1,
        column: (match.index ?? 0) + 1,
        method: match[1],
        text: match[0],
      });
    }
  }

  return matches;
}
