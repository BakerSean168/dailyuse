#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createArtifactManifest } from './create-artifact-manifest.mjs';

const [manifestFile, targetArg] = process.argv.slice(2);
if (!manifestFile || !targetArg)
  throw new Error('Usage: verify-artifact.mjs <artifact-manifest.json> <target>');
const expected = JSON.parse(await readFile(path.resolve(manifestFile), 'utf8'));
const actual = await createArtifactManifest({
  name: expected.name,
  target: path.resolve(targetArg),
  commit: expected.commit,
  sourceManifestDigest: expected.sourceManifestDigest,
  output: path.resolve('.tmp-artifact-verification.json'),
  createdBy: expected.createdBy,
});
if (actual.digest !== expected.digest) {
  console.error(
    `[artifact] digest mismatch for ${expected.name}: expected ${expected.digest}, got ${actual.digest}`,
  );
  process.exitCode = 1;
} else {
  console.log(`[artifact] verified ${expected.name} (${actual.digest})`);
}
