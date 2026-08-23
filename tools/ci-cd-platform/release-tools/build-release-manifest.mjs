import { readFile, writeFile } from 'node:fs/promises';

const [desktopPath, dockerPath, tag, gitSha, ciRunId, output] = process.argv.slice(2);
if (!desktopPath || !dockerPath || !tag || !gitSha || !ciRunId || !output) {
  throw new Error(
    'usage: build-release-manifest.mjs <desktop-manifest> <docker-manifest> <tag> <git-sha> <ci-run-id> <output>',
  );
}
const [desktop, docker] = await Promise.all([
  readFile(desktopPath, 'utf8').then(JSON.parse),
  readFile(dockerPath, 'utf8').then(JSON.parse),
]);
const version = tag.replace(/^v/u, '');
for (const [lane, manifest] of Object.entries({ desktop, docker })) {
  if (manifest.tag !== tag || manifest.version !== version || manifest.gitSha !== gitSha) {
    throw new Error(
      `${lane} release identity mismatch: tag=${manifest.tag} version=${manifest.version} gitSha=${manifest.gitSha}`,
    );
  }
}
if (Number(docker.ciRunId) !== Number(ciRunId)) {
  throw new Error(`docker CI run mismatch: expected ${ciRunId}, got ${docker.ciRunId}`);
}
const manifest = {
  schemaVersion: 1,
  kind: 'memoflow-release',
  version,
  tag,
  gitSha,
  ciRunId: Number(ciRunId),
  desktop,
  docker,
  assembledAt: new Date().toISOString(),
};
await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`);
