import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (file) => readFile(new URL(`../../../${file}`, import.meta.url), 'utf8');

test('candidate publication is a successful-main-CI-only build-once path', async () => {
  const workflow = await read('.github/workflows/candidate-publish.yml');
  assert.match(workflow, /workflow_run:/u);
  assert.match(workflow, /workflows: \[CI\]/u);
  assert.match(workflow, /branches: \[main\]/u);
  assert.match(workflow, /workflow_run\.conclusion == 'success'/u);
  assert.match(workflow, /workflow_run\.event == 'push'/u);
  assert.match(workflow, /workflow_run\.head_branch == 'main'/u);
  assert.doesNotMatch(workflow, /pull_request:/u);
  assert.match(workflow, /name: Download exact CI build closure/u);
  assert.match(workflow, /run-id: \$\{\{ needs\.resolve\.outputs\.ci_run_id \}\}/u);
  assert.match(workflow, /USE_PREBUILT_ARTIFACT=1/u);
});

test('candidate workflow publishes exactly Web API Migrator plus a manifest-bound runtime artifact', async () => {
  const workflow = await read('.github/workflows/candidate-publish.yml');
  for (const component of ['web', 'api', 'migrator']) {
    assert.match(workflow, new RegExp(`component: ${component}`));
    assert.match(workflow, new RegExp(`memoflow-${component}`));
  }
  assert.match(workflow, /candidate-set-v1\.json/u);
  assert.match(workflow, /candidate-manifest\.mjs --validate/u);
  assert.match(workflow, /memoflow-staging-runtime/u);
  assert.match(workflow, /Dockerfile\.runtime/u);
  assert.match(workflow, /Login to ACR/u);
  assert.match(workflow, /Login to GHCR/u);
  assert.match(workflow, /Verify dual-registry digest and OCI revision parity/u);
});

test('staging promotion is freshness-gated and moves only coherent digest identities', async () => {
  const workflow = await read('.github/workflows/candidate-publish.yml');
  assert.match(workflow, /Recheck main HEAD immediately before staging mutation/u);
  assert.match(workflow, /git ls-remote/u);
  assert.match(workflow, /eligible=false/u);
  assert.match(workflow, /imagetools create --prefer-index=false --tag "\$repo:staging-latest" "\$repo@\$digest"/u);
  assert.match(workflow, /Verify coherent staging-latest digests/u);
  assert.doesNotMatch(workflow, /prod-latest/u);
  assert.doesNotMatch(workflow, /ssh /u);
  assert.doesNotMatch(workflow, /gh release/u);
});

test('candidate workflow pins every third-party Action to an immutable commit', async () => {
  const workflow = await read('.github/workflows/candidate-publish.yml');
  const uses = [...workflow.matchAll(/^\s*uses:\s*([^\s#]+)(?:\s+#.*)?$/gmu)].map((match) => match[1]);
  assert.ok(uses.length > 0);
  for (const action of uses) {
    if (action.startsWith('./')) continue;
    assert.match(action, /@[0-9a-f]{40}$/u, `un-pinned action: ${action}`);
  }
});
