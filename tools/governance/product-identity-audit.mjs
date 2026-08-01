#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(SCRIPT_DIRECTORY, '..', '..');
const identity = JSON.parse(readFileSync(path.join(ROOT, 'product.identity.json'), 'utf8'));
const errors = [];

if (!/^[A-Z][A-Za-z0-9]*$/.test(identity.displayName)) {
  errors.push('product.identity.json: displayName must be PascalCase.');
}
if (!/^[a-z][a-z0-9-]*$/.test(identity.slug)) {
  errors.push('product.identity.json: slug must be lowercase kebab-case.');
}
if (identity.packageScope !== `@${identity.slug}`) {
  errors.push('product.identity.json: packageScope must be derived from slug.');
}
if (identity.github?.repository !== identity.slug) {
  errors.push('product.identity.json: GitHub repository must match slug.');
}

const rootPackage = readJson('package.json');
const rootProject = readJson('project.json');
if (rootPackage.name !== identity.slug) {
  errors.push('package.json: root package name must match product identity slug.');
}
if (rootProject.name !== identity.slug) {
  errors.push('project.json: root Nx project name must match product identity slug.');
}

const sharedBrandSource = readFileSync(
  path.join(ROOT, 'packages', 'assets', 'src', 'brand.ts'),
  'utf8',
);
if (!sharedBrandSource.includes(`APP_NAME_EN = '${identity.displayName}'`)) {
  errors.push('packages/assets/src/brand.ts: APP_NAME_EN must match product identity displayName.');
}

const retiredMachinePattern = new RegExp(`daily(?:use|[-_]use)`, 'i');
const retiredDisplayWords = ['Daily', 'Use'].join(' ');
const incorrectDisplayName = `${identity.displayName[0]}${identity.slug.slice(1)}`;
const repositoryPaths = execFileSync(
  'git',
  ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
  {
    cwd: ROOT,
    encoding: 'utf8',
  },
)
  .split('\0')
  .filter(Boolean);

for (const relativePath of repositoryPaths) {
  if (retiredMachinePattern.test(relativePath) || relativePath.includes(retiredDisplayWords)) {
    errors.push(`${relativePath}: filename contains retired product identity.`);
  }

  const absolutePath = path.join(ROOT, relativePath);
  // `git ls-files --cached` includes tracked files staged for deletion. Audits
  // should evaluate the resulting working tree rather than fail while opening
  // a path that intentionally no longer exists.
  if (!existsSync(absolutePath)) {
    continue;
  }

  const content = readFileSync(absolutePath);
  if (content.includes(0)) {
    continue;
  }

  const text = content.toString('utf8');
  if (relativePath.endsWith('package.json')) {
    const packageManifest = JSON.parse(text);
    if (
      packageManifest.name?.startsWith('@') &&
      !packageManifest.name.startsWith(`${identity.packageScope}/`)
    ) {
      errors.push(`${relativePath}: workspace package name must use ${identity.packageScope}.`);
    }
  }
  if (retiredMachinePattern.test(text) || text.includes(retiredDisplayWords)) {
    errors.push(`${relativePath}: content contains retired product identity.`);
  }

  if (text.includes(incorrectDisplayName)) {
    errors.push(`${relativePath}: use "${identity.displayName}" for display text.`);
  }
}

if (errors.length > 0) {
  console.error(`[product-identity-audit] failed with ${errors.length} issue(s):`);
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(
  `[product-identity-audit] passed for ${identity.displayName} (${identity.slug}); audited ${repositoryPaths.length} repository file(s).`,
);

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(ROOT, relativePath), 'utf8'));
}
