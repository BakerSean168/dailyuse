import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readRepoFile = (path) => readFile(new URL(`../../../${path}`, import.meta.url), 'utf8');

test('release-please is an explicit prepare-release workflow and never publishes', async () => {
  const [workflow, config] = await Promise.all([
    readRepoFile('.github/workflows/release-please.yml'),
    readRepoFile('release-please-config.json'),
  ]);

  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /push:\s*\n\s*branches:\s*\n\s*- main/);
  assert.equal(JSON.parse(config).packages['.']['skip-github-release'], true);
});

test('release publish waits for exact CI then calls both reusable release lanes before finalize', async () => {
  const workflow = await readRepoFile('.github/workflows/release-publish.yml');

  assert.match(workflow, /workflow_run:/);
  assert.match(workflow, /workflows:\s*\[?['"]?CI['"]?\]?/);
  assert.match(workflow, /types:\s*\[?completed\]?/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /release-assets\.yml/);
  assert.match(workflow, /publish-images\.yml/);
  assert.match(workflow, /draft:\s*true|draft: true/);
  assert.match(workflow, /release-manifest\.json/);
  assert.match(workflow, /--draft=false/);
});

test('desktop assets and image publishing are reusable retryable lanes, not publish-event or tag-push side effects', async () => {
  const [assets, images] = await Promise.all([
    readRepoFile('.github/workflows/release-assets.yml'),
    readRepoFile('.github/workflows/publish-images.yml'),
  ]);

  for (const workflow of [assets, images]) {
    assert.match(workflow, /workflow_call:/);
    assert.match(workflow, /workflow_dispatch:/);
  }
  assert.doesNotMatch(assets, /release:\s*\n\s*types:\s*\n\s*- published/);
  assert.doesNotMatch(images, /push:\s*\n\s*tags:/);
  assert.match(assets, /desktop-release-manifest\.json/);
  assert.match(images, /docker-release-manifest\.json/);
  assert.doesNotMatch(images, /prod-latest/);
  assert.match(images, /requested SHA was/);
});

test('release tooling exposes fail-closed identity and evidence builders', async () => {
  const [contract, desktop, docker, aggregate] = await Promise.all([
    readRepoFile('tools/ci-cd-platform/release-tools/release-contract.mjs'),
    readRepoFile('tools/ci-cd-platform/release-tools/create-desktop-manifest.mjs'),
    readRepoFile('tools/ci-cd-platform/release-tools/create-docker-manifest.mjs'),
    readRepoFile('tools/ci-cd-platform/release-tools/build-release-manifest.mjs'),
  ]);
  assert.match(contract, /release identity mismatch/);
  assert.match(contract, /CHANGELOG\.md has no release heading/);
  assert.match(desktop, /sha256/);
  assert.match(docker, /API_DIGEST/);
  assert.match(aggregate, /release identity mismatch/);
  assert.match(aggregate, /docker CI run mismatch/);
});
