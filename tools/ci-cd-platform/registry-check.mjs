#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import {
  assertRegistry,
  ARTIFACT_REGISTRY,
  LANE_REGISTRY,
  REGISTRY_VERSION,
} from './lib/registry.mjs';

assertRegistry();
const expected = JSON.parse(
  await readFile('tools/ci-cd-platform/schemas/lane-registry-v1.schema.json', 'utf8'),
);
if (expected.properties?.version?.const !== REGISTRY_VERSION) {
  throw new Error('lane registry schema version does not match implementation');
}
const registry = { version: REGISTRY_VERSION, lanes: LANE_REGISTRY, artifacts: ARTIFACT_REGISTRY };
for (const [name, definition] of Object.entries(registry.lanes)) {
  if (
    !definition.inputs.includes('delivery-manifest') ||
    !definition.outputs.includes('lane-result')
  ) {
    throw new Error(`registry lane ${name} is missing the stable manifest/result boundary`);
  }
}
console.log(
  `[ci-cd-registry] v${REGISTRY_VERSION}; ${Object.keys(LANE_REGISTRY).length} lanes; ${Object.keys(ARTIFACT_REGISTRY).length} artifacts`,
);
