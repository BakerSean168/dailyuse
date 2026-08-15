import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeInventory, buildInventory, classifyTest } from '../lib/test-inventory.mjs';

test('classifies explicit boundary and measurement file names', () => {
  assert.equal(classifyTest('apps/desktop/src/main/ipc/system-handlers.spec.ts'), 'boundary-ipc');
  assert.equal(classifyTest('apps/desktop/src/main/database/db.spec.ts'), 'boundary-main');
  assert.equal(classifyTest('packages/task/src/repository.integration.test.ts'), 'integration');
  assert.equal(classifyTest('packages/task/src/sort.bench.ts'), 'perf');
});

test('gives every Desktop primary file exactly one owner', async () => {
  const inventory = await buildInventory(process.cwd());
  const desktop = inventory.primary.filter((entry) => entry.path.startsWith('apps/desktop/src/'));
  assert.equal(desktop.length, 51);
  assert.equal(new Set(desktop.map((entry) => entry.path)).size, 51);
  assert.equal(desktop.filter((entry) => entry.primarySuite === 'unit').length, 37);
  assert.equal(desktop.filter((entry) => entry.primarySuite === 'boundary-ipc').length, 9);
  assert.equal(desktop.filter((entry) => entry.primarySuite === 'boundary-main').length, 5);
  assert.deepEqual(inventory.missing, []);
  assert.deepEqual(inventory.duplicate, []);
  assert.deepEqual(inventory.unexpected, []);
  assert.deepEqual(inventory.measurementOnly, []);
});

test('reports missing, duplicate, unexpected and measurement-only collectors', () => {
  const files = [
    'apps/example/src/unit.spec.ts',
    'apps/desktop/src/main/ipc/example.ipc.spec.ts',
    'packages/example/src/missing.spec.ts',
    'packages/example/src/measurement.spec.ts',
  ];
  const inventory = analyzeInventory(files, [
    {
      id: 'apps/example/vitest.config.ts',
      type: 'primary',
      suite: 'unit',
      runner: 'vitest',
      files: [files[0], files[1], 'apps/example/src/not-a-test.ts'],
    },
    {
      id: 'apps/desktop/vitest.ipc.config.ts',
      type: 'primary',
      suite: 'boundary-ipc',
      runner: 'vitest',
      files: [files[1]],
    },
    {
      id: 'packages/example/vitest.coverage.config.ts',
      type: 'measurement',
      suite: 'coverage',
      runner: 'vitest',
      files: [files[0], files[3]],
    },
  ]);

  assert.deepEqual(inventory.missing, [files[3], files[2]]);
  assert.deepEqual(inventory.duplicate, [
    {
      path: files[1],
      suites: ['boundary-ipc', 'unit'],
      collectors: ['apps/desktop/vitest.ipc.config.ts', 'apps/example/vitest.config.ts'],
    },
  ]);
  assert.deepEqual(inventory.measurementOnly, [
    {
      path: files[3],
      collectors: ['packages/example/vitest.coverage.config.ts'],
    },
  ]);
  assert.deepEqual(inventory.unexpected, [
    {
      collector: 'apps/example/vitest.config.ts',
      path: 'apps/example/src/not-a-test.ts',
      reason: 'non-inventory-file',
    },
  ]);
});
