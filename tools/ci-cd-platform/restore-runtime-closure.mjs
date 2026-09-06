#!/usr/bin/env node

import { pathToFileURL } from 'node:url';
import { cp, readFile, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { createArtifactManifest } from './create-artifact-manifest.mjs';
import { validateArtifactManifest } from './lib/contracts.mjs';

export async function restoreRuntimeClosure({
  manifestFile,
  sourceArg,
  workspaceArg = '.',
  sourceManifestDigest,
}) {
  const workspaceRoot = path.resolve(workspaceArg);
  const source = path.resolve(sourceArg);
  const expected = JSON.parse(await readFile(path.resolve(manifestFile), 'utf8'));
  validateArtifactManifest(expected);
  if (expected.name !== 'api-runtime-closure') {
    throw new Error(`unexpected runtime closure artifact: ${expected.name}`);
  }
  if (sourceManifestDigest && expected.sourceManifestDigest !== sourceManifestDigest) {
    throw new Error(
      `[artifact] runtime closure source manifest mismatch: expected ${expected.sourceManifestDigest}, got ${sourceManifestDigest}`,
    );
  }
  const sourceInfo = await stat(source).catch(() => null);
  if (!sourceInfo?.isDirectory())
    throw new Error(`runtime closure directory is missing: ${source}`);

  const actual = await createArtifactManifest({
    name: expected.name,
    target: source,
    commit: expected.commit,
    sourceManifestDigest: expected.sourceManifestDigest,
    output: path.resolve('.tmp-runtime-closure-verification.json'),
    createdBy: expected.createdBy,
    entries: expected.entries,
  });
  if (actual.digest !== expected.digest) {
    throw new Error(
      `[artifact] runtime closure digest mismatch: expected ${expected.digest}, got ${actual.digest}`,
    );
  }

  const entries = expected.entries;
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('runtime closure manifest must declare entries');
  }
  const expectedPaths = entries.map(({ path: entryPath }) => entryPath).sort();
  if (new Set(expectedPaths).size !== expectedPaths.length) {
    throw new Error('runtime closure manifest contains duplicate entries');
  }
  const packageRoot = path.join(source, 'packages');
  const actualPaths = [];
  for (const packageEntry of await readdir(packageRoot, { withFileTypes: true }).catch((error) => {
    if (error?.code === 'ENOENT') return [];
    throw error;
  })) {
    if (!packageEntry.isDirectory())
      throw new Error(`unexpected runtime closure entry: packages/${packageEntry.name}`);
    const dist = path.join(packageRoot, packageEntry.name, 'dist');
    const info = await stat(dist).catch(() => null);
    if (!info?.isDirectory())
      throw new Error(
        `runtime closure package dist is missing: packages/${packageEntry.name}/dist`,
      );
    actualPaths.push(`packages/${packageEntry.name}/dist`);
  }
  actualPaths.sort();
  if (
    actualPaths.length !== expectedPaths.length ||
    actualPaths.some((entryPath, index) => entryPath !== expectedPaths[index])
  ) {
    throw new Error(
      `runtime closure entries do not match staged directories: expected ${expectedPaths.join(', ')}, got ${actualPaths.join(', ')}`,
    );
  }
  for (const entry of entries) {
    if (!entry || typeof entry.name !== 'string' || typeof entry.path !== 'string') {
      throw new Error('runtime closure entry is invalid');
    }
    if (!entry.path.startsWith('packages/') || !entry.path.endsWith('/dist')) {
      throw new Error(`runtime closure entry escapes package dist boundary: ${entry.path}`);
    }
    const sourceEntry = path.resolve(source, entry.path);
    const relative = path.relative(source, sourceEntry);
    if (relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error(`runtime closure entry escapes staged directory: ${entry.path}`);
    }
    const info = await stat(sourceEntry).catch(() => null);
    if (!info?.isDirectory()) throw new Error(`runtime closure entry is missing: ${entry.path}`);
    const packageManifest = path.resolve(workspaceRoot, path.dirname(entry.path), 'package.json');
    const packageInfo = JSON.parse(await readFile(packageManifest, 'utf8'));
    if (packageInfo.name !== entry.name) {
      throw new Error(
        `runtime closure package name mismatch for ${entry.path}: expected ${entry.name}, got ${packageInfo.name}`,
      );
    }
    const destination = path.resolve(workspaceRoot, entry.path);
    await rm(destination, { recursive: true, force: true });
    await cp(sourceEntry, destination, {
      recursive: true,
      force: true,
    });
  }
  return entries.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [manifestFile, sourceArg, workspaceArg = '.', sourceManifestDigest] = process.argv.slice(2);
  if (!manifestFile || !sourceArg) {
    throw new Error(
      'Usage: restore-runtime-closure.mjs <artifact-manifest.json> <staged-closure> [workspace-root]',
    );
  }
  const count = await restoreRuntimeClosure({
    manifestFile,
    sourceArg,
    workspaceArg,
    sourceManifestDigest,
  });
  console.log(`[artifact] restored api runtime closure (${count} packages)`);
}
