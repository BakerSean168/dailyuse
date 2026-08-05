import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildPromotionManifest } from '../promote-artifact.mjs';

function artifact(name, artifactDigest = 'a'.repeat(64)) {
  const manifest = {
    kind: 'artifact-manifest-v1',
    version: 1,
    name,
    commit: 'sha',
    digest: artifactDigest,
    sourceManifestDigest: 'a'.repeat(64),
    path: `dist/${name}`,
    createdBy: 'test',
    toolchain: { node: 'test' },
    provenance: { workflow: 'test', runId: null, ref: null },
  };
  if (name === 'api-runtime-closure') {
    manifest.entries = [{ name: '@memoflow/test', path: 'packages/test/dist' }];
  }
  return manifest;
}

test('promotes only artifacts from the same commit', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ci-cd-promotion-'));
  const output = path.join(directory, 'promotion.json');
  const artifacts = [artifact('api'), artifact('web', 'b'.repeat(64))];
  const promotion = await buildPromotionManifest({
    artifactManifests: artifacts,
    commit: 'sha',
    environment: 'preview',
    promotedBy: 'test',
    output,
    sourceManifestDigest: 'a'.repeat(64),
  });
  assert.equal(promotion.kind, 'promotion-manifest-v1');
  assert.equal(JSON.parse(await readFile(output, 'utf8')).artifacts.length, 2);
  await assert.rejects(
    () =>
      buildPromotionManifest({
        artifactManifests: [{ ...artifacts[0], commit: 'other' }],
        commit: 'sha',
        environment: 'preview',
        promotedBy: 'test',
        output,
      }),
    /does not match/,
  );
  await assert.rejects(
    () =>
      buildPromotionManifest({
        artifactManifests: artifacts,
        commit: 'sha',
        environment: 'preview',
        promotedBy: 'test',
        output,
        sourceManifestDigest: 'c'.repeat(64),
      }),
    /do not match the verified delivery manifest/,
  );
});

test('production promotion fails closed unless the complete artifact closure is present', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ci-cd-production-'));
  const output = path.join(directory, 'promotion.json');
  const complete = [
    'api',
    'api-runtime-closure',
    'web',
    'migrator',
    'database',
    'database-runtime',
  ].map((name) => artifact(name));
  const promotion = await buildPromotionManifest({
    artifactManifests: complete,
    commit: 'sha',
    environment: 'production',
    promotedBy: 'test',
    output,
  });
  assert.deepEqual(
    promotion.artifacts.map(({ name }) => name),
    ['api', 'api-runtime-closure', 'database', 'database-runtime', 'migrator', 'web'],
  );
  await assert.rejects(
    () =>
      buildPromotionManifest({
        artifactManifests: complete.filter(({ name }) => name !== 'database'),
        commit: 'sha',
        environment: 'production',
        promotedBy: 'test',
        output,
      }),
    /missing required promotion artifacts: database/,
  );
});
