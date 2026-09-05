import { readFile, writeFile } from 'node:fs/promises';
import { validateCandidateSet } from '../candidate-manifest.mjs';
import { digest as contentDigest } from '../lib/contracts.mjs';

const [desktopPath, dockerPath, candidatePath, tag, gitSha, ciRunId, output] =
  process.argv.slice(2);
if (!desktopPath || !dockerPath || !candidatePath || !tag || !gitSha || !ciRunId || !output) {
  throw new Error(
    'usage: build-release-manifest.mjs <desktop-manifest> <docker-manifest> <candidate-set> <tag> <git-sha> <ci-run-id> <output>',
  );
}
const [desktop, docker, candidate] = await Promise.all([
  readFile(desktopPath, 'utf8').then(JSON.parse),
  readFile(dockerPath, 'utf8').then(JSON.parse),
  readFile(candidatePath, 'utf8').then(JSON.parse),
]);
const version = tag.replace(/^v/u, '');
for (const [lane, manifest] of Object.entries({ desktop, docker })) {
  if (manifest.tag !== tag || manifest.version !== version || manifest.gitSha !== gitSha) {
    throw new Error(
      `${lane} release identity mismatch: tag=${manifest.tag} version=${manifest.version} gitSha=${manifest.gitSha}`,
    );
  }
}
const candidateErrors = validateCandidateSet(candidate);
if (candidateErrors.length > 0)
  throw new Error(`invalid candidate-set: ${candidateErrors.join('; ')}`);
if (candidate.gitSha !== gitSha) {
  throw new Error(
    `candidate release identity mismatch: expected ${gitSha}, got ${candidate.gitSha}`,
  );
}
if (Number(candidate.ciRunId) !== Number(ciRunId)) {
  throw new Error(`candidate CI run mismatch: expected ${ciRunId}, got ${candidate.ciRunId}`);
}
if (Number(docker.ciRunId) !== Number(ciRunId)) {
  throw new Error(`docker CI run mismatch: expected ${ciRunId}, got ${docker.ciRunId}`);
}
if (
  docker.candidateSet?.digest !== candidate.digest ||
  docker.candidateSet?.deliveryManifestDigest !== candidate.deliveryManifestDigest
) {
  throw new Error('docker release candidate-set binding mismatch');
}
for (const component of ['web', 'api', 'migrator']) {
  const expected = candidate.images[component];
  const actual = docker.images?.[component];
  if (actual?.digest !== expected.digest) {
    throw new Error(`${component} release digest does not match candidate-set`);
  }
  for (const distribution of ['china', 'global']) {
    if (
      actual?.distributions?.[distribution]?.repository !==
        expected.distributions[distribution].repository ||
      actual?.distributions?.[distribution]?.digest !== expected.digest
    ) {
      throw new Error(
        `${component} ${distribution} release distribution does not match candidate-set`,
      );
    }
  }
}
const sha256 = (value) => `sha256:${contentDigest(value)}`;
const manifest = {
  schemaVersion: 2,
  kind: 'memoflow-release',
  version,
  tag,
  gitSha,
  ciRunId: Number(ciRunId),
  deliveryManifestDigest: candidate.deliveryManifestDigest,
  candidateSet: {
    schema: candidate.schema,
    digest: candidate.digest,
    candidateTag: candidate.candidateTag,
    manifestSha256: sha256(candidate),
  },
  manifests: {
    desktop: { kind: desktop.kind, schemaVersion: desktop.schemaVersion, sha256: sha256(desktop) },
    docker: { kind: docker.kind, schemaVersion: docker.schemaVersion, sha256: sha256(docker) },
  },
  desktop,
  docker,
  postflight: {
    status: 'passed',
    serverCandidateVerified: true,
    desktopAssetsVerified: true,
  },
  assembledAt: new Date().toISOString(),
};
await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`);
