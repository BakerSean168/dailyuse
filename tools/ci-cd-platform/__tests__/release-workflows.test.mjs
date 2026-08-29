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
  assert.match(workflow, /pull-requests: write/);
  assert.match(workflow, /merge_commit_sha === sha/);
  assert.match(workflow, /autorelease: pending/);
  assert.match(workflow, /autorelease: tagged/);
  assert.match(workflow, /already_published == 'true' \|\| needs\.finalize\.result == 'success'/);
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

test('release image publication distributes one build to China ACR and global GHCR', async () => {
  const [workflow, caller] = await Promise.all([
    readRepoFile('.github/workflows/publish-images.yml'),
    readRepoFile('.github/workflows/release-publish.yml'),
  ]);

  assert.match(workflow, /packages:\s*write/);
  assert.match(caller, /packages:\s*write/);
  assert.match(workflow, /name: Login to GHCR/);
  assert.match(workflow, /registry:\s*ghcr\.io/);
  assert.match(workflow, /password:\s*\$\{\{ github\.token \}\}/);
  assert.equal(workflow.match(/uses: docker\/build-push-action@v6/g)?.length, 3);
  for (const name of ['memoflow-api', 'memoflow-migrator', 'memoflow-web']) {
    assert.match(workflow, new RegExp('ACR_NAMESPACE \\}\\}/' + name));
    assert.match(workflow, new RegExp('global_namespace \\}\\}/' + name));
  }
  assert.match(workflow, /Verify registry digest parity/);
  assert.match(workflow, /GLOBAL_REGISTRY:\s*ghcr\.io/);
});

test('production compose allows China-mirrored runtime dependencies without changing service contracts', async () => {
  const compose = await readRepoFile('docker-compose.prod.yml');

  assert.match(compose, /image: \$\{POSTGRES_IMAGE:-pgvector\/pgvector:0\.8\.5-pg18\}/);
  assert.match(compose, /image: \$\{REDIS_IMAGE:-redis:8-alpine\}/);
  assert.match(compose, /image: \$\{CADDY_IMAGE:-caddy:2-alpine\}/);
  assert.match(compose, /image: \$\{POWERSYNC_IMAGE:-journeyapps\/powersync-service:1\.20\.4\}/);
  assert.match(compose, /image: \$\{WATCHTOWER_IMAGE:-containrrr\/watchtower\}/);
  assert.match(compose, /image: \$\{MIGRATOR_IMAGE:-\$\{REGISTRY:/);
  assert.match(compose, /image: \$\{API_IMAGE:-\$\{REGISTRY:/);
  assert.match(compose, /image: \$\{WEB_IMAGE:-\$\{REGISTRY:/);
});

test('runtime dependencies are digest-pinned and mirrored to both China and global registries', async () => {
  const [workflow, configText] = await Promise.all([
    readRepoFile('.github/workflows/mirror-runtime-images.yml'),
    readRepoFile('tools/ci-cd-platform/runtime-image-mirrors.json'),
  ]);
  const config = JSON.parse(configText);
  assert.deepEqual(config.images.map((entry) => entry.name).sort(), [
    'memoflow-caddy',
    'memoflow-postgres',
    'memoflow-powersync',
    'memoflow-redis',
    'memoflow-watchtower',
  ]);
  for (const entry of config.images) {
    assert.match(entry.source, /@sha256:[a-f0-9]{64}$/);
    assert.equal(entry.platform, 'linux/amd64');
    assert.match(entry.tag, /^[a-z0-9][a-z0-9._-]+$/);
    const digest = entry.source.split('@sha256:')[1];
    assert.equal(entry.tag.endsWith(digest.slice(0, 12)), true);
  }
  assert.match(workflow, /push:\s*\n\s*branches:\s*\[main\]/);
  assert.match(workflow, /runtime-image-mirrors\.json/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /packages:\s*write/);
  assert.match(workflow, /Login to ACR/);
  assert.match(workflow, /Login to GHCR/);
  assert.match(workflow, /skopeo copy --preserve-digests/);
  assert.doesNotMatch(workflow, /skopeo copy --all/);
  assert.match(workflow, /china_digest/);
  assert.match(workflow, /global_digest/);
  assert.match(workflow, /source_digest/);
});
