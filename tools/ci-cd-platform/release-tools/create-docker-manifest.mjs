import { writeFile } from 'node:fs/promises';

const required = [
  'RELEASE_TAG',
  'RELEASE_SHA',
  'RELEASE_CI_RUN_ID',
  'RELEASE_REGISTRY',
  'RELEASE_NAMESPACE',
  'RELEASE_IMMUTABLE_TAG',
  'API_DIGEST',
  'MIGRATOR_DIGEST',
  'WEB_DIGEST',
  'OUTPUT_FILE',
];
for (const key of required) {
  if (!process.env[key]) throw new Error(`${key} is required`);
}
const image = (name, digest) => ({
  repository: `${process.env.RELEASE_REGISTRY}/${process.env.RELEASE_NAMESPACE}/${name}`,
  tags: [process.env.RELEASE_TAG, process.env.RELEASE_IMMUTABLE_TAG],
  digest,
});
const manifest = {
  schemaVersion: 1,
  kind: 'docker-release',
  version: process.env.RELEASE_TAG.replace(/^v/u, ''),
  tag: process.env.RELEASE_TAG,
  gitSha: process.env.RELEASE_SHA,
  ciRunId: Number(process.env.RELEASE_CI_RUN_ID),
  images: {
    api: image('memoflow-api', process.env.API_DIGEST),
    migrator: image('memoflow-migrator', process.env.MIGRATOR_DIGEST),
    web: image('memoflow-web', process.env.WEB_DIGEST),
  },
};
await writeFile(process.env.OUTPUT_FILE, `${JSON.stringify(manifest, null, 2)}\n`);
