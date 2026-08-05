#!/usr/bin/env node

import { cp, mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { createArtifactManifest } from './create-artifact-manifest.mjs';

const WORKSPACE_GLOBS = Object.freeze(['packages', 'apps']);

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function workspacePackages(workspaceRoot) {
  const packages = new Map();
  for (const workspaceRootName of WORKSPACE_GLOBS) {
    const directory = path.join(workspaceRoot, workspaceRootName);
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const packageJson = path.join(directory, entry.name, 'package.json');
      try {
        const manifest = await readJson(packageJson);
        if (manifest.name) {
          packages.set(manifest.name, {
            directory: path.join(directory, entry.name),
            relativeDirectory: path.posix.join(workspaceRootName, entry.name),
            manifest,
          });
        }
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
      }
    }
  }
  return packages;
}

function dependencyNames(manifest) {
  return Object.keys({
    ...manifest.dependencies,
    ...manifest.optionalDependencies,
    ...manifest.peerDependencies,
  });
}

async function collectRuntimePackages({ workspaceRoot, entry }) {
  const packages = await workspacePackages(workspaceRoot);
  const entryManifest = await readJson(path.resolve(workspaceRoot, entry));
  const queue = dependencyNames(entryManifest);
  const selected = new Map();

  while (queue.length > 0) {
    const name = queue.shift();
    if (selected.has(name)) continue;
    const packageInfo = packages.get(name);
    if (!packageInfo) continue;
    selected.set(name, packageInfo);
    queue.push(...dependencyNames(packageInfo.manifest));
  }

  return [...selected.entries()].sort(([left], [right]) => left.localeCompare(right));
}

export async function createRuntimeClosure({
  workspaceRoot = process.cwd(),
  entry = 'apps/api/package.json',
  outputDirectory = 'api-runtime-closure',
  manifestOutput = 'reports/ci-cd-platform/api-runtime-closure-artifact-manifest.json',
  deliveryManifest,
  commit,
  createdBy = 'ci-cd-platform-v2/create-runtime-closure@1',
}) {
  const root = path.resolve(workspaceRoot);
  const output = path.resolve(root, outputDirectory);
  const sourceManifest = await readJson(path.resolve(root, deliveryManifest));
  const selected = await collectRuntimePackages({ workspaceRoot: root, entry });
  if (selected.length === 0) throw new Error('API runtime closure is empty');
  const unsupported = selected.filter(
    ([, packageInfo]) => !packageInfo.relativeDirectory.startsWith('packages/'),
  );
  if (unsupported.length > 0) {
    throw new Error(
      `API runtime closure contains non-package workspace dependencies: ${unsupported.map(([name]) => name).join(', ')}`,
    );
  }

  await rm(output, { recursive: true, force: true });
  for (const [, packageInfo] of selected) {
    const sourceDist = path.join(packageInfo.directory, 'dist');
    const sourceInfo = await stat(sourceDist).catch(() => null);
    if (!sourceInfo?.isDirectory()) {
      throw new Error(
        `Missing built dist for runtime package ${packageInfo.manifest.name}: ${sourceDist}`,
      );
    }
    const destination = path.join(output, packageInfo.relativeDirectory, 'dist');
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(sourceDist, destination, { recursive: true, force: false, errorOnExist: true });
  }

  const entries = selected.map(([name, packageInfo]) => ({
    name,
    path: path.posix.join(packageInfo.relativeDirectory, 'dist'),
  }));
  const artifact = await createArtifactManifest({
    name: 'api-runtime-closure',
    target: output,
    commit: commit ?? sourceManifest.commit,
    sourceManifestDigest: sourceManifest.digest,
    output: path.resolve(root, manifestOutput),
    createdBy,
    entries,
  });
  return artifact;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = new Map();
  for (let index = 2; index < process.argv.length; index += 2) {
    args.set(process.argv[index].replace(/^--/u, ''), process.argv[index + 1]);
  }
  const artifact = await createRuntimeClosure({
    workspaceRoot: process.cwd(),
    entry: args.get('entry') ?? 'apps/api/package.json',
    outputDirectory: args.get('output-dir') ?? 'api-runtime-closure',
    deliveryManifest: args.get('manifest') ?? 'scope/delivery-manifest-v1.json',
    manifestOutput:
      args.get('output') ?? 'reports/ci-cd-platform/api-runtime-closure-artifact-manifest.json',
    commit: args.get('commit'),
  });
  console.log(JSON.stringify(artifact, null, 2));
}
