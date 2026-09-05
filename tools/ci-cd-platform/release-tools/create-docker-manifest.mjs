import { readFile, writeFile } from 'node:fs/promises';
import { validateCandidateSet } from '../candidate-manifest.mjs';

const required = [
  'RELEASE_TAG',
  'RELEASE_SHA',
  'RELEASE_IMMUTABLE_TAG',
  'CANDIDATE_MANIFEST',
  'OUTPUT_FILE',
];
for (const key of required) {
  if (!process.env[key]) throw new Error(`${key} is required`);
}

const candidate = JSON.parse(await readFile(process.env.CANDIDATE_MANIFEST, 'utf8'));
const candidateErrors = validateCandidateSet(candidate);
if (candidateErrors.length > 0) {
  throw new Error(`invalid candidate-set: ${candidateErrors.join('; ')}`);
}
if (candidate.gitSha !== process.env.RELEASE_SHA) {
  throw new Error(
    `candidate git SHA mismatch: expected ${process.env.RELEASE_SHA}, got ${candidate.gitSha}`,
  );
}
if (
  process.env.RELEASE_CI_RUN_ID &&
  String(candidate.ciRunId) !== String(process.env.RELEASE_CI_RUN_ID)
) {
  throw new Error(
    `candidate CI run mismatch: expected ${process.env.RELEASE_CI_RUN_ID}, got ${candidate.ciRunId}`,
  );
}

const tags = [process.env.RELEASE_TAG, process.env.RELEASE_IMMUTABLE_TAG];
const releaseDistribution = (distribution) => ({
  repository: distribution.repository,
  tags,
  digest: distribution.digest,
});
const releaseImage = (component) => {
  const source = candidate.images[component];
  return {
    repository: source.distributions.china.repository,
    tags,
    digest: source.digest,
    distributions: {
      china: releaseDistribution(source.distributions.china),
      global: releaseDistribution(source.distributions.global),
    },
  };
};

const manifest = {
  schemaVersion: 2,
  kind: 'docker-release',
  version: process.env.RELEASE_TAG.replace(/^v/u, ''),
  tag: process.env.RELEASE_TAG,
  gitSha: process.env.RELEASE_SHA,
  ciRunId: Number(candidate.ciRunId),
  candidateSet: {
    schema: candidate.schema,
    digest: candidate.digest,
    gitSha: candidate.gitSha,
    ciRunId: Number(candidate.ciRunId),
    candidateTag: candidate.candidateTag,
    deliveryManifestDigest: candidate.deliveryManifestDigest,
  },
  images: {
    api: releaseImage('api'),
    migrator: releaseImage('migrator'),
    web: releaseImage('web'),
  },
};
await writeFile(process.env.OUTPUT_FILE, `${JSON.stringify(manifest, null, 2)}\n`);
