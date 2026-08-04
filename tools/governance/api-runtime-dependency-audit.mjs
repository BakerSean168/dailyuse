import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const workspaceRoot = process.cwd();
const manifestPaths = ['apps', 'packages'].flatMap((root) =>
  readdirSync(resolve(workspaceRoot, root), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolve(workspaceRoot, root, entry.name, 'package.json'))
    .filter(existsSync),
);
const manifests = new Map(
  manifestPaths.map((path) => {
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    return [manifest.name, { path, manifest }];
  }),
);
const forbiddenRuntimeNames = new Set([
  '@memoflow/test-utils',
  'eslint',
  'tsup',
  'tsx',
  'typescript',
  'vitest',
]);
const queue = ['@memoflow/api'];
const visited = new Set();
const violations = [];

while (queue.length > 0) {
  const packageName = queue.shift();
  if (!packageName || visited.has(packageName)) continue;
  visited.add(packageName);

  const entry = manifests.get(packageName);
  if (!entry) continue;
  const dependencies = entry.manifest.dependencies ?? {};

  for (const dependencyName of Object.keys(dependencies)) {
    if (dependencyName.startsWith('@types/') || forbiddenRuntimeNames.has(dependencyName)) {
      violations.push(`${packageName}: production dependency ${dependencyName}`);
    }
    if (dependencyName.startsWith('@memoflow/')) queue.push(dependencyName);
  }

  if (packageName !== '@memoflow/api') {
    const files = entry.manifest.files;
    if (!Array.isArray(files) || !files.includes('dist') || files.includes('src')) {
      violations.push(`${packageName}: runtime package files must include dist and exclude src`);
    }
  }
}

if (violations.length > 0) {
  console.error('[api-runtime-dependency-audit] failed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  `[api-runtime-dependency-audit] passed for ${visited.size} workspace package(s) in the API closure.`,
);
