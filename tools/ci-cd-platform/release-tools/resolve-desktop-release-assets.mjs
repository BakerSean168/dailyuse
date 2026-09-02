import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const [manifestPath, artifactRoot] = process.argv.slice(2);
if (!manifestPath || !artifactRoot) {
  throw new Error('usage: resolve-desktop-release-assets.mjs <desktop-manifest> <artifact-root>');
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (manifest.kind !== 'desktop-release' || !Array.isArray(manifest.assets)) {
  throw new Error('invalid Desktop release manifest');
}
const files = await walk(artifactRoot);
const byName = new Map();
for (const file of files) {
  const name = path.basename(file);
  const matches = byName.get(name) ?? [];
  matches.push(file);
  byName.set(name, matches);
}

const resolved = [];
for (const asset of manifest.assets) {
  const matches = byName.get(asset.name) ?? [];
  if (matches.length !== 1) {
    throw new Error(
      `Desktop release asset ${asset.name} resolved ${matches.length} files; expected exactly one`,
    );
  }
  const file = matches[0];
  const size = (await stat(file)).size;
  if (size !== asset.size) {
    throw new Error(`Desktop release asset size mismatch: ${asset.name}`);
  }
  const digest = createHash('sha256')
    .update(await readFile(file))
    .digest('hex');
  if (digest !== asset.sha256) {
    throw new Error(`Desktop release asset digest mismatch: ${asset.name}`);
  }
  resolved.push(file);
}

if (new Set(resolved).size !== manifest.assets.length) {
  throw new Error('Desktop release manifest does not resolve to a one-to-one file set');
}
process.stdout.write(`${resolved.join('\0')}\0`);
