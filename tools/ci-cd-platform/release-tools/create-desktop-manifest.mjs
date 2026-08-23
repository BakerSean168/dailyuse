import { createHash } from 'node:crypto';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [root, tag, gitSha, output] = process.argv.slice(2);
if (!root || !tag || !gitSha || !output) {
  throw new Error('usage: create-desktop-manifest.mjs <artifact-root> <tag> <git-sha> <output>');
}

const selected = (name) =>
  /(?:\.exe|\.zip|\.blockmap|\.AppImage|\.deb|\.rpm|latest.*\.ya?ml)$/u.test(name);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else if (entry.isFile() && selected(entry.name)) files.push(absolute);
  }
  return files;
}

const files = (await walk(root)).sort();
if (files.length === 0) throw new Error(`no desktop release assets found under ${root}`);
const assets = [];
for (const file of files) {
  const body = await readFile(file);
  assets.push({
    name: path.basename(file),
    sha256: createHash('sha256').update(body).digest('hex'),
    size: (await stat(file)).size,
  });
}
const manifest = {
  schemaVersion: 1,
  kind: 'desktop-release',
  version: tag.replace(/^v/u, ''),
  tag,
  gitSha,
  assets,
};
await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`);
