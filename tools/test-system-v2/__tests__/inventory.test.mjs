import assert from 'node:assert/strict';
import test from 'node:test';
import { buildInventory, classifyTest } from '../lib/test-inventory.mjs';

test('classifies explicit boundary and measurement file names', () => {
  assert.equal(classifyTest('apps/desktop/src/main/ipc/system-handlers.spec.ts'), 'boundary-ipc');
  assert.equal(classifyTest('apps/desktop/src/main/database/db.spec.ts'), 'boundary-main');
  assert.equal(classifyTest('packages/task/src/repository.integration.test.ts'), 'integration');
  assert.equal(classifyTest('packages/task/src/sort.bench.ts'), 'perf');
});

test('gives every Desktop primary file exactly one owner', async () => {
  const inventory = await buildInventory(process.cwd());
  const desktop = inventory.primary.filter((entry) => entry.path.startsWith('apps/desktop/src/'));
  assert.equal(desktop.length, 46);
  assert.equal(new Set(desktop.map((entry) => entry.path)).size, 46);
  assert.deepEqual(inventory.missing, []);
  assert.deepEqual(inventory.duplicate, []);
  assert.deepEqual(inventory.unexpected, []);
});
