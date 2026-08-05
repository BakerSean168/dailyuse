import { promises as fs } from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';

export const INVENTORY_VERSION = 1;
export const PRIMARY_SUITES = Object.freeze([
  'unit',
  'integration',
  'smoke',
  'boundary-ipc',
  'boundary-main',
  'e2e',
  'perf',
  'governance',
]);

const TEST_FILE = /\.(?:test|spec|bench)\.[cm]?[jt]sx?$/;

export function classifyTest(relativePath) {
  const normalized = relativePath.replaceAll(path.sep, '/');
  const basename = path.basename(normalized);
  if (!TEST_FILE.test(basename)) return null;
  if (/(^|\.)integration\.(?:test|spec)\./.test(basename)) return 'integration';
  if (/(^|\.)smoke\.(?:test|spec)\./.test(basename)) return 'smoke';
  if (/(^|\.)bench\./.test(basename)) return 'perf';
  if (normalized.startsWith('tools/governance/')) return 'governance';
  if (normalized.includes('/e2e/') || normalized.startsWith('apps/web/e2e/')) return 'e2e';
  if (normalized.startsWith('apps/desktop/src/main/')) {
    if (
      normalized.includes('/ipc/') ||
      /(?:^|[-.])ipc(?:[-.])/.test(basename)
    ) return 'boundary-ipc';
    if (
      normalized.includes('/database/') ||
      normalized.includes('/bootstrap') ||
      normalized.includes('/lifecycle/') ||
      /(?:^|\.)main\.(?:test|spec)\./.test(basename)
    ) return 'boundary-main';
  }
  return 'unit';
}

export async function collectTestFiles(root) {
  const files = await fg([
    'apps/**/*.{test,spec,bench}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    'packages/**/*.{test,spec,bench}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    'tools/**/*.{test,spec,bench}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
  ], { cwd: root, dot: false, ignore: ['**/node_modules/**', '**/dist/**', '**/coverage/**'] });
  return files.map((file) => file.replaceAll(path.sep, '/')).sort();
}

export async function buildInventory(root) {
  const files = await collectTestFiles(root);
  const entries = files.map((file) => ({ path: file, primarySuite: classifyTest(file) }));
  const missing = entries.filter((entry) => !entry.primarySuite).map((entry) => entry.path);
  const duplicate = [];
  const unexpected = entries.filter((entry) => !PRIMARY_SUITES.includes(entry.primarySuite)).map((entry) => entry.path);
  return {
    version: INVENTORY_VERSION,
    primary: entries,
    measurementSuites: { coverage: entries.filter((entry) => entry.primarySuite === 'unit').map((entry) => entry.path) },
    measurementOnly: [],
    missing,
    duplicate,
    unexpected,
    counts: Object.fromEntries(PRIMARY_SUITES.map((suite) => [suite, entries.filter((entry) => entry.primarySuite === suite).length])),
  };
}

export async function writeInventory(root, output = 'tools/test-system-v2/test-inventory.json') {
  const inventory = await buildInventory(root);
  const target = path.resolve(root, output);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, `${JSON.stringify(inventory, null, 2)}\n`);
  return inventory;
}
