#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { findUnpinnedActionUses } from './lib/github-action-pinning.mjs';

const root = resolve(import.meta.dirname, '../..');
const scanRoots = [join(root, '.github/workflows'), join(root, '.github/actions')];

function yamlFiles(directory, output = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) yamlFiles(full, output);
    else if (/\.ya?ml$/u.test(entry.name)) output.push(full);
  }
  return output;
}

const files = scanRoots.flatMap((directory) => yamlFiles(directory)).sort();
const violations = files.flatMap((file) =>
  findUnpinnedActionUses({
    file: relative(root, file).replaceAll('\\', '/'),
    content: readFileSync(file, 'utf8'),
  }),
);

if (violations.length > 0) {
  console.error(
    `[github-action-pinning-audit] FAIL: ${violations.length} mutable/undocumented third-party Action ref(s)`,
  );
  for (const violation of violations) {
    console.error(
      `- ${violation.file}:${violation.line} ${violation.action}@${violation.ref || '<missing>'}: ${violation.reason}`,
    );
  }
  process.exit(1);
}

console.log(
  `[github-action-pinning-audit] passed: ${files.length} workflow/composite Action file(s) use immutable documented third-party pins.`,
);
