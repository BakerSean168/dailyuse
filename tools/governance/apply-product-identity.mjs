#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(SCRIPT_DIRECTORY, '..', '..');
const identity = JSON.parse(readFileSync(path.join(ROOT, 'product.identity.json'), 'utf8'));
const args = parseArgs(process.argv.slice(2));

if (!args.fromDisplay || !args.fromSlug) {
  console.error(
    'Usage: node tools/governance/apply-product-identity.mjs --from-display <name> --from-slug <slug>',
  );
  process.exit(1);
}

if (args.fromDisplay === identity.displayName || args.fromSlug === identity.slug) {
  console.error('The previous identity must differ from product.identity.json.');
  process.exit(1);
}

const trackedAndUntracked = execFileSync(
  'git',
  ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
  { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
)
  .split('\0')
  .filter(Boolean);
const replacements = buildReplacements(args, identity);
let changedFiles = 0;

for (const relativePath of trackedAndUntracked) {
  const absolutePath = path.join(ROOT, relativePath);
  const content = readFileSync(absolutePath);
  if (content.includes(0)) {
    continue;
  }

  const before = content.toString('utf8');
  let after = before;
  for (const [from, to] of replacements) {
    after = after.replaceAll(from, to);
  }

  if (after !== before) {
    writeFileSync(absolutePath, after);
    changedFiles += 1;
  }
}

console.log(
  `[apply-product-identity] migrated ${changedFiles} text file(s) to ${identity.displayName} (${identity.slug}).`,
);

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key === '--from-display') {
      result.fromDisplay = value;
    } else if (key === '--from-slug') {
      result.fromSlug = value;
    }
  }
  return result;
}

function buildReplacements(previous, next) {
  const previousUpper = previous.fromSlug.toUpperCase();
  const previousTitle = `${previous.fromSlug[0].toUpperCase()}${previous.fromSlug.slice(1)}`;
  const previousWords = splitDisplayName(previous.fromDisplay);
  const previousKebab = previousWords.toLowerCase().replaceAll(' ', '-');
  const nextUpper = next.slug.toUpperCase();
  const nextIncorrectTitle = `${next.slug[0].toUpperCase()}${next.slug.slice(1)}`;

  return [
    [`@${previous.fromSlug}`, next.packageScope],
    [previousUpper, nextUpper],
    [previous.fromDisplay, next.displayName],
    [previousTitle, next.displayName],
    [previousWords, next.displayName],
    [previousKebab, next.slug],
    [nextIncorrectTitle, next.displayName],
    [previous.fromSlug, next.slug],
  ].sort(([left], [right]) => right.length - left.length);
}

function splitDisplayName(displayName) {
  return displayName.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}
