import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [root, platform, os, arch, signingState, tag, gitSha] = process.argv.slice(2);
if (!root || !platform || !os || !arch || !signingState || !tag || !gitSha) {
  throw new Error(
    'usage: write-desktop-platform-receipt.mjs <artifact-root> <platform> <os> <arch> <signing-state> <tag> <git-sha>',
  );
}

const PLATFORM_POLICY = Object.freeze({
  'windows-x64': { os: 'windows', arch: 'x64', signing: new Set(['unsigned', 'signed']) },
  'linux-x64': { os: 'linux', arch: 'x64', signing: new Set(['unsigned']) },
  'macos-x64': {
    os: 'macos',
    arch: 'x64',
    signing: new Set(['unsigned-pilot', 'signed-notarized']),
  },
  'macos-arm64': {
    os: 'macos',
    arch: 'arm64',
    signing: new Set(['unsigned-pilot', 'signed-notarized']),
  },
});

const policy = PLATFORM_POLICY[platform];
if (!policy) throw new Error(`unsupported Desktop platform: ${platform}`);
if (policy.os !== os || policy.arch !== arch) {
  throw new Error(`Desktop platform identity mismatch: ${platform} != ${os}-${arch}`);
}
if (!policy.signing.has(signingState)) {
  throw new Error(`unsupported signing state ${signingState} for ${platform}`);
}

const selected = (name) =>
  /(?:\.exe|\.zip|\.dmg|\.blockmap|\.AppImage|\.deb|\.rpm|latest.*\.ya?ml)$/u.test(name);
const entries = await readdir(root, { withFileTypes: true });
const assets = entries
  .filter((entry) => entry.isFile() && selected(entry.name))
  .map((entry) => entry.name)
  .sort();
if (assets.length === 0) throw new Error(`no release assets found for ${platform} under ${root}`);

const requiredExtensions = {
  'windows-x64': [/\.exe$/u],
  'linux-x64': [/\.AppImage$/u, /\.deb$/u, /\.rpm$/u],
  'macos-x64': [/\.dmg$/u, /\.zip$/u],
  'macos-arm64': [/\.dmg$/u, /\.zip$/u],
};
for (const pattern of requiredExtensions[platform]) {
  if (!assets.some((asset) => pattern.test(asset))) {
    throw new Error(`${platform} is missing required asset ${pattern}`);
  }
}
const architectureToken = new RegExp(`(?:^|-)${arch}(?:-|\\.)`, 'u');
if (os === 'macos' && assets.some((asset) => !architectureToken.test(asset))) {
  throw new Error(`${platform} assets must include an explicit ${arch} token`);
}

const receipt = {
  schemaVersion: 1,
  kind: 'desktop-platform-receipt',
  platform,
  os,
  arch,
  signingState,
  version: tag.replace(/^v/u, ''),
  tag,
  gitSha,
  assets,
};
await writeFile(
  path.join(root, 'desktop-platform-receipt.json'),
  `${JSON.stringify(receipt, null, 2)}\n`,
);
