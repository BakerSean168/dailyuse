import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildPromotionManifest } from '../promote-artifact.mjs';

test('promotes only artifacts from the same commit', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ci-cd-promotion-'));
  const output = path.join(directory, 'promotion.json');
  const artifacts = [
    {
      kind: 'artifact-manifest-v1',
      version: 1,
      name: 'api',
      commit: 'sha',
      digest: 'a'.repeat(64),
      sourceManifestDigest: 'm'.repeat(64),
      path: 'apps/api/dist',
      createdBy: 'test',
    },
    {
      kind: 'artifact-manifest-v1',
      version: 1,
      name: 'web',
      commit: 'sha',
      digest: 'b'.repeat(64),
      sourceManifestDigest: 'm'.repeat(64),
      path: 'dist/apps/web',
      createdBy: 'test',
    },
  ];
  const promotion = await buildPromotionManifest({
    artifactManifests: artifacts,
    commit: 'sha',
    environment: 'production',
    promotedBy: 'test',
    output,
  });
  assert.equal(promotion.kind, 'promotion-manifest-v1');
  assert.equal(JSON.parse(await readFile(output, 'utf8')).artifacts.length, 2);
  await assert.rejects(
    () =>
      buildPromotionManifest({
        artifactManifests: [{ ...artifacts[0], commit: 'other' }],
        commit: 'sha',
        environment: 'production',
        promotedBy: 'test',
        output,
      }),
    /does not match/,
  );
});
