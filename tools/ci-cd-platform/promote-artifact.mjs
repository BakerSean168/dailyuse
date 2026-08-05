#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { digest, validateArtifactManifest, validatePromotionManifest } from './lib/contracts.mjs';

export const PRODUCTION_ARTIFACTS = Object.freeze([
  'api',
  'api-runtime-closure',
  'web',
  'migrator',
  'database',
  'database-runtime',
]);

export async function buildPromotionManifest({
  artifactManifests,
  commit,
  environment,
  promotedBy,
  output,
  requiredArtifacts = environment === 'production' ? PRODUCTION_ARTIFACTS : [],
  sourceManifestDigest = null,
}) {
  if (!Array.isArray(artifactManifests) || artifactManifests.length === 0)
    throw new Error('at least one artifact manifest is required');
  for (const artifact of artifactManifests) validateArtifactManifest(artifact);
  if (artifactManifests.some((artifact) => artifact.commit !== commit))
    throw new Error('artifact commit does not match promotion commit');
  const names = new Set(artifactManifests.map((artifact) => artifact.name));
  const missing = requiredArtifacts.filter((name) => !names.has(name));
  if (missing.length > 0) {
    throw new Error(`missing required promotion artifacts: ${missing.join(', ')}`);
  }
  const sourceManifestDigests = new Set(
    artifactManifests.map((artifact) => artifact.sourceManifestDigest),
  );
  if (sourceManifestDigests.size !== 1) {
    throw new Error('promotion artifacts do not share one delivery manifest digest');
  }
  if (sourceManifestDigest && !sourceManifestDigests.has(sourceManifestDigest)) {
    throw new Error('promotion artifacts do not match the verified delivery manifest');
  }
  const promotion = {
    kind: 'promotion-manifest-v1',
    version: 1,
    commit,
    environment,
    promotedBy,
    artifacts: artifactManifests
      .map(
        ({
          name,
          digest: artifactDigest,
          sourceManifestDigest,
          path,
          createdBy,
          toolchain,
          provenance,
        }) => ({
          name,
          digest: artifactDigest,
          sourceManifestDigest,
          path,
          createdBy,
          toolchain,
          provenance,
        }),
      )
      .sort((left, right) => left.name.localeCompare(right.name)),
  };
  promotion.digest = digest(promotion);
  validatePromotionManifest(promotion);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(promotion, null, 2)}\n`);
  return promotion;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [manifestDirectory, commit, environment, outputArg] = process.argv.slice(2);
  if (!manifestDirectory || !commit || !environment || !outputArg)
    throw new Error(
      'Usage: promote-artifact.mjs <manifest-directory> <commit> <environment> <output>',
    );
  const files = (await import('node:fs/promises')).readdir(manifestDirectory);
  const manifests = await Promise.all(
    files
      .filter((file) => file.endsWith('-artifact-manifest.json'))
      .map(async (file) => JSON.parse(await readFile(path.join(manifestDirectory, file), 'utf8'))),
  );
  const promotion = await buildPromotionManifest({
    artifactManifests: manifests,
    commit,
    environment,
    promotedBy: process.env.GITHUB_ACTOR ?? 'local',
    output: path.resolve(outputArg),
    sourceManifestDigest: process.env.DELIVERY_MANIFEST_DIGEST ?? null,
  });
  console.log(JSON.stringify(promotion, null, 2));
}
