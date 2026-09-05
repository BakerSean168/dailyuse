import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createCandidateSet } from '../candidate-manifest.mjs';
import { readReleaseContract } from '../release-tools/release-contract.mjs';

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

async function createReleaseRepo({ desktopVersion = '1.2.3', manifestVersion = '1.2.3' } = {}) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'memoflow-release-contract-'));
  await mkdir(path.join(cwd, 'apps/desktop'), { recursive: true });
  await writeFile(path.join(cwd, 'package.json'), '{"version":"1.2.3"}\n');
  await writeFile(
    path.join(cwd, 'apps/desktop/package.json'),
    `${JSON.stringify({ version: desktopVersion })}\n`,
  );
  await writeFile(
    path.join(cwd, '.release-please-manifest.json'),
    `${JSON.stringify({ '.': manifestVersion })}\n`,
  );
  await writeFile(
    path.join(cwd, 'CHANGELOG.md'),
    '# Changelog\n\n## [1.2.3] (2026-08-23)\n\n### Features\n\n* release lifecycle\n\n## [1.2.2]\n',
  );
  git(cwd, ['init', '-q']);
  git(cwd, ['config', 'user.email', 'release-test@example.com']);
  git(cwd, ['config', 'user.name', 'Release Test']);
  git(cwd, ['add', '.']);
  git(cwd, ['commit', '-q', '-m', 'chore(main): release 1.2.3 (#999)']);
  return cwd;
}

async function createMergedReleaseRepo() {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'memoflow-release-merge-contract-'));
  await mkdir(path.join(cwd, 'apps/desktop'), { recursive: true });
  git(cwd, ['init', '-q', '-b', 'main']);
  git(cwd, ['config', 'user.email', 'release-test@example.com']);
  git(cwd, ['config', 'user.name', 'Release Test']);

  await writeFile(path.join(cwd, 'package.json'), '{"version":"1.2.2"}\n');
  await writeFile(path.join(cwd, 'apps/desktop/package.json'), '{"version":"1.2.2"}\n');
  await writeFile(path.join(cwd, '.release-please-manifest.json'), '{".":"1.2.2"}\n');
  await writeFile(path.join(cwd, 'CHANGELOG.md'), '# Changelog\n\n## [1.2.2]\n');
  git(cwd, ['add', '.']);
  git(cwd, ['commit', '-q', '-m', 'chore: baseline']);

  git(cwd, ['checkout', '-q', '-b', 'release']);
  await writeFile(path.join(cwd, 'package.json'), '{"version":"1.2.3"}\n');
  await writeFile(path.join(cwd, 'apps/desktop/package.json'), '{"version":"1.2.3"}\n');
  await writeFile(path.join(cwd, '.release-please-manifest.json'), '{".":"1.2.3"}\n');
  await writeFile(
    path.join(cwd, 'CHANGELOG.md'),
    '# Changelog\n\n## [1.2.3] (2026-08-29)\n\n### Features\n\n* merged release lifecycle\n\n## [1.2.2]\n',
  );
  git(cwd, ['add', '.']);
  git(cwd, ['commit', '-q', '-m', 'chore(main): release 1.2.3 (#999)']);

  git(cwd, ['checkout', '-q', 'main']);
  git(cwd, [
    'merge',
    '-q',
    '--no-ff',
    'release',
    '-m',
    'Merge pull request #999 from test/release',
  ]);
  return cwd;
}

test('release contract binds release commit, package versions, manifest, changelog and SHA', async () => {
  const cwd = await createReleaseRepo();
  try {
    const contract = await readReleaseContract({ cwd });
    assert.equal(contract.eligible, true);
    assert.equal(contract.version, '1.2.3');
    assert.equal(contract.tag, 'v1.2.3');
    assert.equal(contract.sha, git(cwd, ['rev-parse', 'HEAD']));
    assert.match(contract.notes, /release lifecycle/);
    assert.doesNotMatch(contract.notes, /1\.2\.2/);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test('release contract recognizes the merged release PR head while binding the merge SHA', async () => {
  const cwd = await createMergedReleaseRepo();
  try {
    const contract = await readReleaseContract({ cwd });
    assert.equal(contract.eligible, true);
    assert.equal(contract.version, '1.2.3');
    assert.equal(contract.tag, 'v1.2.3');
    assert.equal(contract.sha, git(cwd, ['rev-parse', 'HEAD']));
    assert.match(contract.notes, /merged release lifecycle/);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test('release contract fails closed on version identity drift', async () => {
  const cwd = await createReleaseRepo({ desktopVersion: '1.2.2' });
  try {
    await assert.rejects(() => readReleaseContract({ cwd }), /release identity mismatch/);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test('release evidence builders bind Desktop assets to the exact server candidate', async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'memoflow-release-evidence-'));
  const artifacts = path.join(cwd, 'artifacts');
  await mkdir(artifacts, { recursive: true });
  const desktopPath = path.join(cwd, 'desktop-release-manifest.json');
  const dockerPath = path.join(cwd, 'docker-release-manifest.json');
  const candidatePath = path.join(cwd, 'candidate-set-v1.json');
  const releasePath = path.join(cwd, 'release-manifest.json');
  const receiptTool = path.join(
    repoRoot,
    'tools/ci-cd-platform/release-tools/write-desktop-platform-receipt.mjs',
  );
  const desktopTool = path.join(
    repoRoot,
    'tools/ci-cd-platform/release-tools/create-desktop-manifest.mjs',
  );
  const gitSha = 'a'.repeat(40);
  const candidateTag = `sha-${gitSha}`;
  const digestFor = (char) => `sha256:${char.repeat(64)}`;
  const component = (name, char) => ({
    tag: candidateTag,
    digest: digestFor(char),
    revision: gitSha,
    distributions: {
      china: {
        repository: `registry.example.test/memoflow/memoflow-${name}`,
        tag: candidateTag,
        digest: digestFor(char),
      },
      global: {
        repository: `ghcr.io/bakersean168/memoflow-${name}`,
        tag: candidateTag,
        digest: digestFor(char),
      },
    },
  });
  const candidate = createCandidateSet({
    gitSha,
    ciRunId: '42',
    deliveryManifestDigest: digestFor('d'),
    images: {
      web: component('web', '1'),
      api: component('api', '2'),
      migrator: component('migrator', '3'),
    },
    generatedAt: '2026-09-05T00:00:00.000Z',
  });
  await writeFile(candidatePath, `${JSON.stringify(candidate, null, 2)}\n`);
  const platformFixtures = [
    {
      platform: 'windows-x64',
      os: 'windows',
      arch: 'x64',
      signing: 'unsigned',
      runtimeKind: 'packaged-exe',
      files: ['MemoFlow-Windows-1.2.3-Setup.exe', 'latest.yml'],
    },
    {
      platform: 'linux-x64',
      os: 'linux',
      arch: 'x64',
      signing: 'unsigned',
      runtimeKind: 'installed-deb',
      files: [
        'MemoFlow-Linux-1.2.3.AppImage',
        'MemoFlow-Linux-1.2.3.deb',
        'MemoFlow-Linux-1.2.3.rpm',
        'latest-linux.yml',
      ],
    },
    {
      platform: 'macos-x64',
      os: 'macos',
      arch: 'x64',
      signing: 'unsigned-pilot',
      runtimeKind: 'packaged-app',
      files: ['MemoFlow-macOS-x64-1.2.3.dmg', 'MemoFlow-macOS-x64-1.2.3.zip'],
    },
    {
      platform: 'macos-arm64',
      os: 'macos',
      arch: 'arm64',
      signing: 'unsigned-pilot',
      runtimeKind: 'packaged-app',
      files: ['MemoFlow-macOS-arm64-1.2.3.dmg', 'MemoFlow-macOS-arm64-1.2.3.zip'],
    },
  ];
  try {
    for (const fixture of platformFixtures) {
      const directory = path.join(artifacts, `desktop-${fixture.platform}`);
      await mkdir(directory, { recursive: true });
      await Promise.all(
        fixture.files.map((name) =>
          writeFile(path.join(directory, name), `${fixture.platform}:${name}`),
        ),
      );
      execFileSync(
        process.execPath,
        [
          receiptTool,
          directory,
          fixture.platform,
          fixture.os,
          fixture.arch,
          fixture.signing,
          'v1.2.3',
          gitSha,
          'passed',
          'packaged-electron-playwright',
          fixture.runtimeKind,
        ],
        { cwd: repoRoot },
      );
    }

    execFileSync(process.execPath, [desktopTool, artifacts, 'v1.2.3', gitSha, desktopPath], {
      cwd: repoRoot,
    });
    execFileSync(
      process.execPath,
      [path.join(repoRoot, 'tools/ci-cd-platform/release-tools/create-docker-manifest.mjs')],
      {
        cwd: repoRoot,
        env: {
          ...process.env,
          RELEASE_TAG: 'v1.2.3',
          RELEASE_SHA: gitSha,
          RELEASE_CI_RUN_ID: '42',
          RELEASE_IMMUTABLE_TAG: `v1.2.3-${gitSha.slice(0, 12)}`,
          CANDIDATE_MANIFEST: candidatePath,
          OUTPUT_FILE: dockerPath,
        },
      },
    );
    execFileSync(
      process.execPath,
      [
        path.join(repoRoot, 'tools/ci-cd-platform/release-tools/build-release-manifest.mjs'),
        desktopPath,
        dockerPath,
        candidatePath,
        'v1.2.3',
        gitSha,
        '42',
        releasePath,
      ],
      { cwd: repoRoot },
    );

    const manifest = JSON.parse(
      await (await import('node:fs/promises')).readFile(releasePath, 'utf8'),
    );
    assert.equal(manifest.schemaVersion, 2);
    assert.equal(manifest.version, '1.2.3');
    assert.equal(manifest.tag, 'v1.2.3');
    assert.equal(manifest.gitSha, gitSha);
    assert.equal(manifest.ciRunId, 42);
    assert.equal(manifest.deliveryManifestDigest, digestFor('d'));
    assert.equal(manifest.candidateSet.digest, candidate.digest);
    assert.equal(manifest.candidateSet.candidateTag, candidateTag);
    assert.match(manifest.candidateSet.manifestSha256, /^sha256:[a-f0-9]{64}$/u);
    assert.match(manifest.manifests.desktop.sha256, /^sha256:[a-f0-9]{64}$/u);
    assert.match(manifest.manifests.docker.sha256, /^sha256:[a-f0-9]{64}$/u);
    assert.equal(manifest.postflight.status, 'passed');
    assert.deepEqual(manifest.desktop.requiredPlatforms, [
      'windows-x64',
      'linux-x64',
      'macos-x64',
      'macos-arm64',
    ]);
    assert.equal(manifest.desktop.schemaVersion, 2);
    assert.equal(manifest.desktop.assets.length, 10);
    assert.equal(manifest.desktop.platforms['macos-arm64'].signingState, 'unsigned-pilot');
    assert.equal(manifest.desktop.platforms['linux-x64'].runtimeValidation.status, 'passed');
    assert.equal(
      manifest.desktop.platforms['linux-x64'].runtimeValidation.executableKind,
      'installed-deb',
    );
    assert.equal(manifest.docker.schemaVersion, 2);
    assert.equal(manifest.docker.candidateSet.digest, candidate.digest);
    assert.equal(manifest.docker.images.api.digest, digestFor('2'));
    assert.deepEqual(manifest.docker.images.api.tags, ['v1.2.3', `v1.2.3-${gitSha.slice(0, 12)}`]);
    assert.equal(
      manifest.docker.images.api.distributions.china.repository,
      'registry.example.test/memoflow/memoflow-api',
    );
    assert.equal(
      manifest.docker.images.api.distributions.global.repository,
      'ghcr.io/bakersean168/memoflow-api',
    );
    assert.equal(manifest.docker.images.api.distributions.china.digest, digestFor('2'));
    assert.equal(manifest.docker.images.api.distributions.global.digest, digestFor('2'));
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test('canonical release manifest fails closed when promoted Docker evidence drifts from candidate-set', async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'memoflow-release-candidate-drift-'));
  const gitSha = 'b'.repeat(40);
  const digestFor = (char) => `sha256:${char.repeat(64)}`;
  const candidateTag = `sha-${gitSha}`;
  const image = (name, char) => ({
    tag: candidateTag,
    digest: digestFor(char),
    revision: gitSha,
    distributions: {
      china: {
        repository: `registry.test/memoflow-${name}`,
        tag: candidateTag,
        digest: digestFor(char),
      },
      global: {
        repository: `ghcr.io/test/memoflow-${name}`,
        tag: candidateTag,
        digest: digestFor(char),
      },
    },
  });
  const candidate = createCandidateSet({
    gitSha,
    ciRunId: '77',
    deliveryManifestDigest: digestFor('d'),
    images: { web: image('web', '1'), api: image('api', '2'), migrator: image('migrator', '3') },
    generatedAt: '2026-09-05T00:00:00.000Z',
  });
  const candidatePath = path.join(cwd, 'candidate.json');
  const desktopPath = path.join(cwd, 'desktop.json');
  const dockerPath = path.join(cwd, 'docker.json');
  const output = path.join(cwd, 'release.json');
  const releaseImage = (source) => ({
    repository: source.distributions.china.repository,
    tags: ['v1.2.3', `v1.2.3-${gitSha.slice(0, 12)}`],
    digest: source.digest,
    distributions: {
      china: { ...source.distributions.china, tags: ['v1.2.3'] },
      global: { ...source.distributions.global, tags: ['v1.2.3'] },
    },
  });
  const docker = {
    schemaVersion: 2,
    kind: 'docker-release',
    version: '1.2.3',
    tag: 'v1.2.3',
    gitSha,
    ciRunId: 77,
    candidateSet: {
      digest: candidate.digest,
      deliveryManifestDigest: candidate.deliveryManifestDigest,
    },
    images: {
      web: releaseImage(candidate.images.web),
      api: releaseImage(candidate.images.api),
      migrator: releaseImage(candidate.images.migrator),
    },
  };
  docker.images.api.digest = digestFor('e');
  try {
    await writeFile(candidatePath, `${JSON.stringify(candidate)}\n`);
    await writeFile(
      desktopPath,
      `${JSON.stringify({ schemaVersion: 2, kind: 'desktop-release', version: '1.2.3', tag: 'v1.2.3', gitSha })}\n`,
    );
    await writeFile(dockerPath, `${JSON.stringify(docker)}\n`);
    assert.throws(
      () =>
        execFileSync(
          process.execPath,
          [
            path.join(repoRoot, 'tools/ci-cd-platform/release-tools/build-release-manifest.mjs'),
            desktopPath,
            dockerPath,
            candidatePath,
            'v1.2.3',
            gitSha,
            '77',
            output,
          ],
          { cwd: repoRoot, stdio: 'pipe' },
        ),
      /api release digest does not match candidate-set/u,
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test('Docker release evidence rejects a caller CI identity that differs from candidate-set', async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'memoflow-release-ci-mismatch-'));
  const gitSha = 'c'.repeat(40);
  const candidateTag = `sha-${gitSha}`;
  const digestFor = (char) => `sha256:${char.repeat(64)}`;
  const image = (name, char) => ({
    tag: candidateTag,
    digest: digestFor(char),
    revision: gitSha,
    distributions: {
      china: {
        repository: `registry.test/memoflow-${name}`,
        tag: candidateTag,
        digest: digestFor(char),
      },
      global: {
        repository: `ghcr.io/test/memoflow-${name}`,
        tag: candidateTag,
        digest: digestFor(char),
      },
    },
  });
  const candidate = createCandidateSet({
    gitSha,
    ciRunId: '42',
    deliveryManifestDigest: digestFor('d'),
    images: { web: image('web', '1'), api: image('api', '2'), migrator: image('migrator', '3') },
  });
  const candidatePath = path.join(cwd, 'candidate.json');
  await writeFile(candidatePath, `${JSON.stringify(candidate)}\n`);
  try {
    assert.throws(
      () =>
        execFileSync(
          process.execPath,
          [path.join(repoRoot, 'tools/ci-cd-platform/release-tools/create-docker-manifest.mjs')],
          {
            cwd: repoRoot,
            stdio: 'pipe',
            env: {
              ...process.env,
              RELEASE_TAG: 'v1.2.3',
              RELEASE_SHA: gitSha,
              RELEASE_CI_RUN_ID: '43',
              RELEASE_IMMUTABLE_TAG: `v1.2.3-${gitSha.slice(0, 12)}`,
              CANDIDATE_MANIFEST: candidatePath,
              OUTPUT_FILE: path.join(cwd, 'docker.json'),
            },
          },
        ),
      /candidate CI run mismatch: expected 43, got 42/u,
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test('Desktop release manifest fails closed when a required platform is missing', async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'memoflow-desktop-platform-missing-'));
  const directory = path.join(cwd, 'desktop-windows-x64');
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'MemoFlow-Windows-1.2.3-Setup.exe'), 'asset');
  try {
    execFileSync(
      process.execPath,
      [
        path.join(
          repoRoot,
          'tools/ci-cd-platform/release-tools/write-desktop-platform-receipt.mjs',
        ),
        directory,
        'windows-x64',
        'windows',
        'x64',
        'unsigned',
        'v1.2.3',
        'abc123',
        'passed',
        'packaged-electron-playwright',
        'packaged-exe',
      ],
      { cwd: repoRoot },
    );
    assert.throws(
      () =>
        execFileSync(
          process.execPath,
          [
            path.join(repoRoot, 'tools/ci-cd-platform/release-tools/create-desktop-manifest.mjs'),
            cwd,
            'v1.2.3',
            'abc123',
            path.join(cwd, 'desktop-release-manifest.json'),
          ],
          { cwd: repoRoot, stdio: 'pipe' },
        ),
      /missing required Desktop platform/u,
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test('Desktop asset resolution follows the manifest and remote verification rejects omissions', async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'memoflow-release-assets-'));
  const artifactRoot = path.join(cwd, 'artifacts');
  const platformRoot = path.join(artifactRoot, 'desktop-macos-arm64');
  const manifestPath = path.join(cwd, 'desktop-release-manifest.json');
  const releasePath = path.join(cwd, 'release.json');
  const assetName = 'MemoFlow-macOS-arm64-1.2.3.zip';
  const assetPath = path.join(platformRoot, assetName);
  try {
    await mkdir(platformRoot, { recursive: true });
    await writeFile(assetPath, 'exact-macos-archive');
    const { createHash } = await import('node:crypto');
    const body = Buffer.from('exact-macos-archive');
    const sha256 = createHash('sha256').update(body).digest('hex');
    const manifest = {
      schemaVersion: 2,
      kind: 'desktop-release',
      assets: [{ name: assetName, size: body.length, sha256 }],
    };
    await writeFile(manifestPath, `${JSON.stringify(manifest)}\n`);

    const resolved = execFileSync(process.execPath, [
      path.join(repoRoot, 'tools/ci-cd-platform/release-tools/resolve-desktop-release-assets.mjs'),
      manifestPath,
      artifactRoot,
    ]);
    assert.deepEqual(resolved.toString().split('\0').filter(Boolean), [assetPath]);

    await writeFile(
      releasePath,
      `${JSON.stringify({
        assets: [
          { name: assetName, size: body.length, digest: `sha256:${sha256}`, state: 'uploaded' },
        ],
      })}\n`,
    );
    execFileSync(
      process.execPath,
      [
        path.join(repoRoot, 'tools/ci-cd-platform/release-tools/verify-desktop-release-assets.mjs'),
        manifestPath,
        releasePath,
      ],
      { stdio: 'pipe' },
    );

    await writeFile(releasePath, '{"assets":[]}\n');
    assert.throws(
      () =>
        execFileSync(
          process.execPath,
          [
            path.join(
              repoRoot,
              'tools/ci-cd-platform/release-tools/verify-desktop-release-assets.mjs',
            ),
            manifestPath,
            releasePath,
          ],
          { stdio: 'pipe' },
        ),
      /occurred 0 times/u,
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test('Desktop platform receipt refuses failed runtime validation evidence', async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'memoflow-runtime-receipt-fail-'));
  try {
    await writeFile(path.join(cwd, 'MemoFlow-Windows-1.2.3-Setup.exe'), 'asset');
    assert.throws(
      () =>
        execFileSync(
          process.execPath,
          [
            path.join(
              repoRoot,
              'tools/ci-cd-platform/release-tools/write-desktop-platform-receipt.mjs',
            ),
            cwd,
            'windows-x64',
            'windows',
            'x64',
            'unsigned',
            'v1.2.3',
            'abc123',
            'failed',
            'packaged-electron-playwright',
            'packaged-exe',
          ],
          { cwd: repoRoot, stdio: 'pipe' },
        ),
      /runtime validation must pass/u,
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test('packaged executable resolver follows electron-builder output conventions across four Desktop targets', async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'memoflow-packaged-executable-'));
  const resolver = path.join(repoRoot, 'apps/desktop/scripts/resolve-packaged-executable.mjs');
  const fixtures = [
    ['linux-unpacked/memoflow', 'linux-x64'],
    ['win-unpacked/memoflow.exe', 'windows-x64'],
    ['mac/memoflow.app/Contents/MacOS/memoflow', 'macos-x64'],
    ['mac-arm64/memoflow.app/Contents/MacOS/memoflow', 'macos-arm64'],
  ];

  try {
    for (const [relative] of fixtures) {
      const target = path.join(cwd, ...relative.split('/'));
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, 'runtime-binary');
    }

    for (const [relative, platform] of fixtures) {
      const resolved = execFileSync(process.execPath, [resolver, cwd, platform], {
        encoding: 'utf8',
      }).trim();
      assert.equal(resolved, path.join(cwd, ...relative.split('/')));
    }
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
