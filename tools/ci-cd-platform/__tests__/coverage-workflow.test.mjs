import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowUrl = new URL('../../../.github/workflows/coverage.yml', import.meta.url);

test('coverage docs-only no-target path emits canonical lane evidence', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  const noTargetStep = workflow.match(
    /- name: Record no coverage targets selected[\s\S]*?(?=\n      - name: Run governed coverage gates)/,
  )?.[0];

  assert.ok(noTargetStep, 'coverage workflow must define a no-target evidence step');
  assert.match(noTargetStep, /if: steps\.detect-coverage\.outputs\.has_target != 'true'/);
  assert.match(noTargetStep, /DELIVERY_LANE: coverage/);
  assert.match(noTargetStep, /TEST_REPORT_NAME: coverage-no-targets/);
  assert.match(noTargetStep, /tools\/test-system-v2\/run-command\.mjs/);
});
