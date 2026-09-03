import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const [rootArg, platform] = process.argv.slice(2);
if (!rootArg || !platform) {
  throw new Error('usage: resolve-packaged-executable.mjs <dist-package-root> <platform>');
}
const root = path.resolve(rootArg);

async function walk(directory, depth = 0) {
  if (depth > 5) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...(await walk(absolute, depth + 1)));
    else if (entry.isFile()) results.push(absolute);
  }
  return results;
}

const files = await walk(root);
const normalizePath = (file) => file.split(path.sep).join('/');
const macExecutable = /\/[^/]+\.app\/Contents\/MacOS\/memoflow$/iu;
const matchers = {
  'linux-x64': (file) => /\/linux-unpacked\/memoflow$/u.test(normalizePath(file)),
  'windows-x64': (file) => /\/win-unpacked\/memoflow\.exe$/iu.test(normalizePath(file)),
  'macos-x64': (file) => {
    const normalized = normalizePath(file);
    return macExecutable.test(normalized) && !/arm64/iu.test(normalized);
  },
  'macos-arm64': (file) => macExecutable.test(normalizePath(file)),
};
const matcher = matchers[platform];
if (!matcher) throw new Error(`unsupported packaged Desktop platform: ${platform}`);
const candidates = files.filter(matcher);
if (platform === 'macos-arm64' && candidates.length > 1) {
  const arm = candidates.filter((file) => /arm64/iu.test(file));
  if (arm.length === 1) candidates.splice(0, candidates.length, arm[0]);
}
if (candidates.length !== 1) {
  throw new Error(
    `expected exactly one packaged executable for ${platform}, found ${candidates.length}: ${candidates.join(', ')}`,
  );
}
if ((await stat(candidates[0])).size <= 0) {
  throw new Error(`packaged executable is empty: ${candidates[0]}`);
}
process.stdout.write(candidates[0]);
