import { readFile } from 'node:fs/promises';

const [manifestPath, releaseJsonPath] = process.argv.slice(2);
if (!manifestPath || !releaseJsonPath) {
  throw new Error(
    'usage: verify-desktop-release-assets.mjs <desktop-manifest> <github-release-json>',
  );
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const release = JSON.parse(await readFile(releaseJsonPath, 'utf8'));
if (manifest.kind !== 'desktop-release' || !Array.isArray(manifest.assets)) {
  throw new Error('invalid Desktop release manifest');
}
if (!Array.isArray(release.assets)) throw new Error('GitHub Release JSON has no assets array');

const byName = new Map();
for (const asset of release.assets) {
  const entries = byName.get(asset.name) ?? [];
  entries.push(asset);
  byName.set(asset.name, entries);
}

for (const expected of manifest.assets) {
  const matches = byName.get(expected.name) ?? [];
  if (matches.length !== 1) {
    throw new Error(
      `GitHub Release asset ${expected.name} occurred ${matches.length} times; expected exactly one`,
    );
  }
  const actual = matches[0];
  if (actual.state !== 'uploaded') {
    throw new Error(`GitHub Release asset is not uploaded: ${expected.name}`);
  }
  if (actual.size !== expected.size) {
    throw new Error(`GitHub Release asset size mismatch: ${expected.name}`);
  }
  if (actual.digest !== `sha256:${expected.sha256}`) {
    throw new Error(`GitHub Release asset digest mismatch: ${expected.name}`);
  }
}

console.log(`DESKTOP_RELEASE_ASSETS=PASS count=${manifest.assets.length}`);
