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

test('desktop packaging has one stable product identity and one native rebuild owner', async () => {
  const [packageText, builder, projectText, workflow] = await Promise.all([
    readRepoFile('apps/desktop/package.json'),
    readRepoFile('apps/desktop/electron-builder.json5'),
    readRepoFile('apps/desktop/project.json'),
    readRepoFile('.github/workflows/release-assets.yml'),
  ]);
  const packageJson = JSON.parse(packageText);
  const project = JSON.parse(projectText);

  assert.equal(packageJson.productName, 'MemoFlow');
  assert.equal(packageJson.desktopName, 'memoflow.desktop');
  assert.equal(packageJson.dependencies['dotenv-expand'], '13.0.0');
  assert.equal(packageJson.devDependencies['@electron/rebuild'], undefined);
  assert.match(builder, /"appId": "com\.memoflow\.app"/);
  assert.match(builder, /"productName": "MemoFlow"/);
  assert.match(builder, /"executableName": "memoflow"/);
  assert.match(builder, /"desktopName": "memoflow\.desktop"/);
  assert.match(builder, /"syncDesktopName": true/);
  assert.match(builder, /"npmRebuild": true/);
  assert.match(builder, /\.\.\/\.\.\/packages\/assets\/dist\/images\/logos\/MemoFlow\.ico/);
  assert.match(builder, /\.\.\/\.\.\/packages\/assets\/dist\/images\/logos\/MemoFlow-512\.png/);
  assert.match(builder, /"from": "\.\.\/\.\.\/packages\/database"/);
  assert.match(builder, /"to": "node_modules\/@memoflow\/database"/);
  assert.match(builder, /"from": "\.\.\/\.\.\/node_modules\/dotenv-expand"/);
  assert.deepEqual(project.targets.package.dependsOn, ['build']);
  assert.deepEqual(project.targets.dist.dependsOn, ['build']);
  assert.match(
    project.targets['native-rebuild'].options.command,
    /electron-builder install-app-deps/,
  );

  assert.match(workflow, /Checkout release packaging tooling/);
  assert.match(workflow, /ref: \$\{\{ github\.workflow_sha \}\}/);
  assert.match(workflow, /path: release-tooling/);
  assert.match(workflow, /Checkout exact release source/);
  assert.match(workflow, /path: release-source/);
  assert.match(workflow, /release-tooling\/apps\/desktop\/electron-builder\.json5/);
  assert.match(workflow, /name: Download build artifacts[\s\S]*?pattern: desktop-\*/);
  assert.doesNotMatch(workflow, /desktop:dist/);
  assert.doesNotMatch(workflow, /npm_config_msvs_version/);
  assert.match(workflow, /msbuild-architecture: x64/);
});

test('release image publication uses registry-compatible image manifests', async () => {
  const workflow = await readRepoFile('.github/workflows/publish-images.yml');

  assert.equal(workflow.match(/^\s+provenance: false$/gmu)?.length, 3);
  assert.equal(workflow.match(/^\s+sbom: false$/gmu)?.length, 3);
  assert.doesNotMatch(workflow, /^\s+(?:provenance|sbom): true$/mu);
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
