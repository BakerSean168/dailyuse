#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { validateArtifactManifest, validateDeliveryManifest } from './lib/contracts.mjs';

async function filesUnder(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(root, absolute)));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

async function contentDigest(target) {
  const info = await stat(target);
  const files = info.isDirectory() ? await filesUnder(target) : [target];
  const hash = createHash('sha256');
  for (const file of files) {
    const relative = path.relative(path.dirname(target), file).split(path.sep).join('/');
    hash.update(relative);
    hash.update('\0');
    hash.update(await readFile(file));
    hash.update('\0');
  }
  return hash.digest('hex');
}

export async function createArtifactManifest({
  name,
  target,
  commit,
  sourceManifestDigest,
  output,
  createdBy = 'ci-cd-platform-v2/create-artifact-manifest@1',
  entries,
}) {
  if (!name || !target || !commit || !sourceManifestDigest || !output)
    throw new Error('name, target, commit, sourceManifestDigest and output are required');
  const manifest = {
    kind: 'artifact-manifest-v1',
    version: 1,
    name,
    commit,
    digest: await contentDigest(target),
    sourceManifestDigest,
    path: path.relative(process.cwd(), target).split(path.sep).join('/'),
    createdBy,
    toolchain: { node: process.version },
    provenance: {
      workflow: process.env.GITHUB_WORKFLOW ?? 'local',
      runId: process.env.GITHUB_RUN_ID ?? null,
      ref: process.env.GITHUB_REF ?? null,
    },
    ...(entries ? { entries } : {}),
  };
  validateArtifactManifest(manifest);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = new Map();
  for (let index = 2; index < process.argv.length; index += 2)
    args.set(process.argv[index].replace(/^--/u, ''), process.argv[index + 1]);
  const target = path.resolve(args.get('path') ?? 'dist');
  const output = path.resolve(
    args.get('output') ?? 'reports/ci-cd-platform/artifact-manifest.json',
  );
  const source = JSON.parse(
    await readFile(path.resolve(args.get('manifest') ?? 'scope/delivery-manifest-v1.json'), 'utf8'),
  );
  validateDeliveryManifest(source);
  const artifact = await createArtifactManifest({
    name: args.get('name'),
    target,
    commit: args.get('commit') ?? source.commit,
    sourceManifestDigest: source.digest,
    output,
  });
  console.log(JSON.stringify(artifact, null, 2));
}
