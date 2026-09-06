#!/usr/bin/env node

import { pathToFileURL } from 'node:url';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createArtifactManifest } from './create-artifact-manifest.mjs';
import { validateArtifactManifest } from './lib/contracts.mjs';

export async function verifyArtifact({ manifestFile, target, sourceManifestDigest = null }) {
  const expected = JSON.parse(await readFile(path.resolve(manifestFile), 'utf8'));
  validateArtifactManifest(expected);
  if (sourceManifestDigest && expected.sourceManifestDigest !== sourceManifestDigest) {
    throw new Error(
      `[artifact] source manifest mismatch for ${expected.name}: expected ${expected.sourceManifestDigest}, got ${sourceManifestDigest}`,
    );
  }
  const verificationRoot = await mkdtemp(path.join(tmpdir(), 'memoflow-artifact-verify-'));
  let actual;
  try {
    actual = await createArtifactManifest({
      name: expected.name,
      target: path.resolve(target),
      commit: expected.commit,
      sourceManifestDigest: expected.sourceManifestDigest,
      output: path.join(verificationRoot, 'manifest.json'),
      createdBy: expected.createdBy,
      entries: expected.entries,
    });
  } finally {
    await rm(verificationRoot, { recursive: true, force: true });
  }
  if (actual.digest !== expected.digest) {
    throw new Error(
      `[artifact] digest mismatch for ${expected.name}: expected ${expected.digest}, got ${actual.digest}`,
    );
  }
  return actual;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [manifestFile, target, sourceManifestDigest] = process.argv.slice(2);
  if (!manifestFile || !target) {
    throw new Error(
      'Usage: verify-artifact.mjs <artifact-manifest.json> <target> [source-manifest-digest]',
    );
  }
  verifyArtifact({ manifestFile, target, sourceManifestDigest })
    .then((actual) => console.log(`[artifact] verified ${actual.name} (${actual.digest})`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
