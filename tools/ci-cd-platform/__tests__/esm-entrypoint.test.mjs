import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const platformRoot = path.resolve(import.meta.dirname, '..');
const unsafeMainGuard = /file:\/\/\$\{process\.argv\[1\]\}/u;

async function listMjsFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(root, entry.name);
      if (entry.isDirectory()) return listMjsFiles(target);
      return entry.isFile() && entry.name.endsWith('.mjs') ? [target] : [];
    }),
  );
  return nested.flat();
}

test('CI/CD executable ESM entrypoints do not use platform-unsafe file://${process.argv[1]} guards', async () => {
  const files = (await listMjsFiles(platformRoot)).filter(
    (file) => !file.includes(`${path.sep}__tests__${path.sep}`),
  );
  const violations = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    if (unsafeMainGuard.test(source)) violations.push(path.relative(platformRoot, file));
  }
  assert.deepEqual(violations, []);
});
