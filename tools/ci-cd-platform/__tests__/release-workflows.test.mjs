import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readRepoFile = (path) => readFile(new URL(`../../../${path}`, import.meta.url), 'utf8');

function workflowStep(workflow, name) {
  const marker = `- name: ${name}`;
  const start = workflow.indexOf(marker);
  assert.notEqual(start, -1, `workflow step not found: ${name}`);
  const next = workflow.indexOf('\n      - name:', start + marker.length);
  return workflow.slice(start, next < 0 ? workflow.length : next);
}

test('release-please maintains the Release PR only after successful main CI and never publishes', async () => {
  const [workflow, config] = await Promise.all([
    readRepoFile('.github/workflows/release-please.yml'),
    readRepoFile('release-please-config.json'),
  ]);

  assert.match(workflow, /workflow_run:/);
  assert.match(workflow, /workflows:\s*\[?['"]CI['"]\]?/);
  assert.match(workflow, /types:\s*\[?completed\]?/);
  assert.match(workflow, /branches:\s*\[?main\]?/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /workflow_run\.conclusion == 'success'/);
  assert.match(workflow, /workflow_run\.event == 'push'/);
  assert.match(workflow, /workflow_run\.head_branch == 'main'/);
  assert.match(workflow, /group:\s*prepare-release-main/);
  assert.doesNotMatch(workflow, /push:\s*\n\s*branches:/);
  assert.doesNotMatch(workflow, /gh release|createRelease|createRef|docker\/build-push-action/u);
  assert.match(workflow, /googleapis\/release-please-action@[0-9a-f]{40}/u);
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
  assert.match(workflow, /github\.paginate\(github\.rest\.repos\.listReleases/u);
  assert.match(workflow, /release\.tag_name === tag/u);
  assert.match(workflow, /matches\.length > 1/u);
  assert.match(workflow, /ambiguous release records/u);
  assert.doesNotMatch(workflow, /getReleaseByTag/u);
  assert.match(workflow, /autorelease: pending/);
  assert.match(workflow, /autorelease: tagged/);
  assert.match(workflow, /already_published == 'true' \|\| needs\.finalize\.result == 'success'/);
});

test('release validation checkouts retain merge-parent history', async () => {
  const [caller, assets, images] = await Promise.all([
    readRepoFile('.github/workflows/release-publish.yml'),
    readRepoFile('.github/workflows/release-assets.yml'),
    readRepoFile('.github/workflows/publish-images.yml'),
  ]);

  const prepareCheckout = workflowStep(caller, 'Checkout exact release SHA');
  const desktopCheckout = workflowStep(assets, 'Checkout exact release source');
  const dockerCheckout = workflowStep(images, 'Checkout exact release SHA');

  assert.match(prepareCheckout, /ref: \$\{\{ needs\.resolve\.outputs\.sha \}\}/);
  assert.match(desktopCheckout, /ref: \$\{\{ needs\.prepare-release\.outputs\.release_sha \}\}/);
  assert.match(dockerCheckout, /ref: \$\{\{ needs\.prepare-release\.outputs\.release_sha \}\}/);
  for (const step of [prepareCheckout, desktopCheckout, dockerCheckout]) {
    assert.match(step, /fetch-depth:\s*0/);
  }
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
  const resolverStep = workflowStep(workflow, 'Resolve packaged Desktop executable');
  assert.match(resolverStep, /release-tooling\/apps\/desktop\/scripts\/resolve-packaged-executable\.mjs/);
  assert.doesNotMatch(resolverStep, /node \.\/apps\/desktop\/scripts\/resolve-packaged-executable\.mjs/u);
  assert.match(workflow, /name: Download build artifacts[\s\S]*?pattern: desktop-\*/);
  assert.doesNotMatch(workflow, /desktop:dist/);
  assert.doesNotMatch(workflow, /npm_config_msvs_version/);
  assert.match(workflow, /msbuild-architecture: x64/);
  const windowsNativeRebuild = workflowStep(
    workflow,
    'Rebuild hoisted Windows native dependencies for Electron',
  );
  assert.match(windowsNativeRebuild, /if: runner\.os == 'Windows'/u);
  assert.match(windowsNativeRebuild, /working-directory: release-source/u);
  assert.match(windowsNativeRebuild, /await import\('@electron\/rebuild'\)/u);
  assert.doesNotMatch(windowsNativeRebuild, /--input-type/u);
  assert.match(windowsNativeRebuild, /devDependencies\?\.electron/u);
  assert.match(windowsNativeRebuild, /buildPath: desktop/u);
  assert.match(windowsNativeRebuild, /projectRootPath: root/u);
  assert.match(windowsNativeRebuild, /onlyModules: requiredModules/u);
  assert.match(windowsNativeRebuild, /\['argon2', 'better-sqlite3'\]/u);
  assert.match(windowsNativeRebuild, /platform: 'win32'/u);
  assert.match(windowsNativeRebuild, /mode: 'sequential'/u);
  assert.match(windowsNativeRebuild, /modules-found/u);
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

test('Desktop release matrix covers Windows, Linux, macOS Intel and Apple Silicon with fail-closed receipts', async () => {
  const [workflow, builder, receipt, manifest] = await Promise.all([
    readRepoFile('.github/workflows/release-assets.yml'),
    readRepoFile('apps/desktop/electron-builder.json5'),
    readRepoFile('tools/ci-cd-platform/release-tools/write-desktop-platform-receipt.mjs'),
    readRepoFile('tools/ci-cd-platform/release-tools/create-desktop-manifest.mjs'),
  ]);

  for (const platform of ['windows-x64', 'linux-x64', 'macos-x64', 'macos-arm64']) {
    assert.match(workflow, new RegExp(`platform: ${platform}`));
    assert.match(manifest, new RegExp(`['"]${platform}['"]`));
  }
  assert.match(workflow, /os: macos-15-intel[\s\S]*?builder_args: --mac dmg zip --x64/);
  assert.match(workflow, /os: macos-15[\s\S]*?builder_args: --mac dmg zip --arm64/);
  assert.match(workflow, /signing_state: unsigned-pilot/);
  assert.match(workflow, /CSC_IDENTITY_AUTO_DISCOVERY: 'false'/);
  assert.match(workflow, /write-desktop-platform-receipt\.mjs/);
  assert.match(workflow, /resolve-desktop-release-assets\.mjs/);
  assert.match(workflow, /verify-desktop-release-assets\.mjs/);
  assert.match(builder, /\$\{productName\}-macOS-\$\{arch\}-\$\{version\}/);
  assert.match(receipt, /signed-notarized/);
  assert.match(manifest, /missing required Desktop platform/);
  assert.match(manifest, /duplicate Desktop release asset name/);
});

test('touched V3 release workflows pin external actions by immutable commit', async () => {
  const workflows = await Promise.all([
    readRepoFile('.github/workflows/release-please.yml'),
    readRepoFile('.github/workflows/release-assets.yml'),
  ]);
  for (const workflow of workflows) {
    const externalUses = [...workflow.matchAll(/uses:\s+([^./\s][^@\s]+)@([^\s#]+)/gu)];
    assert.ok(externalUses.length > 0);
    for (const [, action, ref] of externalUses) {
      assert.match(ref, /^[0-9a-f]{40}$/u, `${action} must use a full commit SHA`);
    }
  }
});

test('CI has one long-lived main branch target and full-main policy is encoded by the manifest generator', async () => {
  const [workflow, generator] = await Promise.all([
    readRepoFile('.github/workflows/ci.yml'),
    readRepoFile('tools/ci-cd-platform/generate-delivery-manifest.mjs'),
  ]);
  assert.equal((workflow.match(/branches:\s*\[main\]/gu) ?? []).length, 2);
  assert.doesNotMatch(workflow, /develop/u);
  assert.match(generator, /event === 'push' && ref === 'refs\/heads\/main'/u);
});

test('Desktop upload and release publication are manifest-owned and verify the remote asset set', async () => {
  const [assets, publish] = await Promise.all([
    readRepoFile('.github/workflows/release-assets.yml'),
    readRepoFile('.github/workflows/release-publish.yml'),
  ]);
  const upload = workflowStep(
    assets,
    'Upload the manifest-owned asset set to the draft GitHub Release',
  );
  assert.match(upload, /resolve-desktop-release-assets\.mjs/);
  assert.match(upload, /expected_count=.*\.assets \| length/);
  assert.match(upload, /verify-desktop-release-assets\.mjs/);
  assert.match(upload, /gh release view .*--json apiUrl/u);
  assert.match(upload, /gh api "\$release_api_url"/u);
  assert.doesNotMatch(upload, /releases\/tags\//u);
  assert.doesNotMatch(upload, /find artifacts.*-name/);

  const remoteGate = workflowStep(
    publish,
    'Verify the remote Draft contains every manifest-owned Desktop asset',
  );
  assert.match(remoteGate, /gh release view .*--json apiUrl/u);
  assert.match(remoteGate, /gh api "\$release_api_url"/u);
  assert.doesNotMatch(remoteGate, /releases\/tags\//u);
  assert.match(remoteGate, /verify-desktop-release-assets\.mjs/);
  assert.ok(
    publish.indexOf('Verify the remote Draft contains every manifest-owned Desktop asset') <
      publish.indexOf('Upload canonical manifest and publish'),
  );
  for (const workflow of [assets, publish]) {
    for (const [, action, ref] of workflow.matchAll(/uses:\s+([^./\s][^@\s]+)@([^\s#]+)/gu)) {
      assert.match(ref, /^[0-9a-f]{40}$/u, `${action} must use a full commit SHA`);
    }
  }
});

test('Desktop release runtime gates execute before receipts and cannot be bypassed', async () => {
  const [workflow, receipt, manifest, helper] = await Promise.all([
    readRepoFile('.github/workflows/release-assets.yml'),
    readRepoFile('tools/ci-cd-platform/release-tools/write-desktop-platform-receipt.mjs'),
    readRepoFile('tools/ci-cd-platform/release-tools/create-desktop-manifest.mjs'),
    readRepoFile('apps/desktop/scripts/run-linux-packaged-smoke-with-keyring.sh'),
  ]);

  const packageIndex = workflow.indexOf('- name: Package desktop application');
  const packagedSmokeIndex = workflow.indexOf('- name: Run packaged Desktop runtime smoke');
  const installDebIndex = workflow.indexOf('- name: Install Linux Debian package');
  const installedSmokeIndex = workflow.indexOf('- name: Run installed Linux Debian runtime smoke');
  const receiptIndex = workflow.indexOf('- name: Write Desktop platform receipt');
  const uploadIndex = workflow.indexOf('- name: Upload build artifacts');
  assert.ok(packageIndex < packagedSmokeIndex);
  assert.ok(packagedSmokeIndex < installDebIndex);
  assert.ok(installDebIndex < installedSmokeIndex);
  assert.ok(installedSmokeIndex < receiptIndex);
  assert.ok(receiptIndex < uploadIndex);

  const packagedSmoke = workflowStep(workflow, 'Run packaged Desktop runtime smoke');
  const installedSmoke = workflowStep(workflow, 'Run installed Linux Debian runtime smoke');
  const installDeb = workflowStep(workflow, 'Install Linux Debian package');
  assert.match(installDeb, /deb_path="\$\(realpath/u);
  assert.match(installDeb, /apt-get install -y "\$deb_path"/u);
  assert.doesNotMatch(installDeb, /apt-get install -y "\$\{debs\[0\]\}"/u);
  for (const step of [packagedSmoke, installedSmoke]) {
    assert.doesNotMatch(step, /continue-on-error\s*:\s*true/u);
    assert.doesNotMatch(step, /\|\|\s*true/u);
  }
  assert.match(packagedSmoke, /run-linux-packaged-smoke-with-keyring|test:packaged-smoke/u);
  assert.match(installedSmoke, /run-linux-packaged-smoke-with-keyring/u);
  assert.match(helper, /test:packaged-smoke/u);
  assert.match(workflow, /runtime_executable_kind: installed-deb/u);
  assert.match(workflow, /gnome-keyring/u);
  assert.match(workflow, /write-desktop-platform-receipt\.mjs[\s\S]*?packaged-electron-playwright[\s\S]*?runtime_executable_kind/u);
  assert.match(receipt, /schemaVersion:\s*2/u);
  assert.match(receipt, /runtimeValidation/u);
  assert.match(receipt, /runtime validation must pass/u);
  assert.match(manifest, /runtime validation missing or failed/u);
  assert.match(helper, /org\.freedesktop\.secrets/u);
  assert.match(helper, /MEMOFLOW_PACKAGED_USE_GNOME_KEYRING=1/u);
  assert.match(helper, /xvfb-run -a dbus-run-session -- bash -lc/u);
  assert.ok(helper.indexOf('xvfb-run -a dbus-run-session') < helper.indexOf('gnome-keyring-daemon --unlock'));
  assert.match(helper, /secret-tool store/u);
  assert.match(helper, /secret-tool lookup/u);
  assert.match(workflow, /libglib2\.0-bin/u);
  assert.doesNotMatch(helper, /setUsePlainTextEncryption|password-store=basic/u);
});
