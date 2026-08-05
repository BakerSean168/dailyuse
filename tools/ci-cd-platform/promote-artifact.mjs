#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { digest, validateArtifactManifest } from './lib/contracts.mjs';

export async function buildPromotionManifest({
  artifactManifests,
  commit,
  environment,
  promotedBy,
  output,
}) {
  if (!Array.isArray(artifactManifests) || artifactManifests.length === 0)
    throw new Error('at least one artifact manifest is required');
  for (const artifact of artifactManifests) validateArtifactManifest(artifact);
  if (artifactManifests.some((artifact) => artifact.commit !== commit))
    throw new Error('artifact commit does not match promotion commit');
  const promotion = {
    kind: 'promotion-manifest-v1',
    version: 1,
    commit,
    environment,
    promotedBy,
    artifacts: artifactManifests
      .map(({ name, digest: artifactDigest, sourceManifestDigest }) => ({
        name,
        digest: artifactDigest,
        sourceManifestDigest,
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
  };
  promotion.digest = digest(promotion);
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
  });
  console.log(JSON.stringify(promotion, null, 2));
}
