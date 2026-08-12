/**
 * Normalize Prisma-generated client artifacts.
 *
 * Prisma's client generator emits JSDoc separator lines with trailing
 * whitespace (" * ") and, on some toolchains, CRLF line endings. This makes
 * `git diff --check` noisy and can break diff/patch gates.
 *
 * This script rewrites the generated client directory so every text file is:
 *   - LF line endings
 *   - free of trailing whitespace
 *
 * Usage: node tools/build/normalize-generated-prisma.mjs [dir]
 * Default dir: packages/database/src/generated/prisma
 */

import fs from 'node:fs';
import path from 'node:path';

const TEXT_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.json', '.prisma', '.map']);

const defaultDir = path.resolve(
  import.meta.dirname,
  '../../packages/database/src/generated/prisma',
);
const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : defaultDir;

function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

let changed = 0;
for (const file of walk(targetDir)) {
  if (!TEXT_EXTENSIONS.has(path.extname(file))) continue;
  const original = fs.readFileSync(file, 'utf8');
  const normalized = original.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '');
  if (normalized !== original) {
    fs.writeFileSync(file, normalized);
    changed++;
  }
}

console.log(`✅ Normalized ${changed} generated Prisma file(s) in ${targetDir}`);
