import { createHash } from 'node:crypto';

export const DELIVERY_MANIFEST_VERSION = 1;
export const LANE_INPUT_VERSION = 1;
export const LANE_RESULT_VERSION = 1;
export const ARTIFACT_MANIFEST_VERSION = 1;

const RISK_LEVELS = new Set(['docs', 'package', 'runtime', 'web-flow', 'root', 'release']);
const LANE_NAMES = new Set([
  'governance',
  'validate',
  'boundary',
  'integration',
  'web',
  'coverage',
  'performance',
]);

export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`;
}

export function digest(value) {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

function assert(condition, message) {
  if (!condition) throw new Error(`Contract validation failed: ${message}`);
}

function assertString(value, field) {
  assert(typeof value === 'string' && value.length > 0, `${field} must be a non-empty string`);
}

function assertStringArray(value, field) {
  assert(Array.isArray(value), `${field} must be an array`);
  assert(
    value.every((entry) => typeof entry === 'string'),
    `${field} must contain strings`,
  );
}

export function validateDeliveryManifest(manifest) {
  assert(manifest && typeof manifest === 'object', 'manifest must be an object');
  assert(manifest.kind === 'delivery-manifest-v1', 'kind must be delivery-manifest-v1');
  assert(manifest.version === DELIVERY_MANIFEST_VERSION, 'unsupported manifest version');
  assertString(manifest.commit, 'commit');
  assert(
    manifest.base === null || typeof manifest.base === 'string',
    'base must be null or string',
  );
  assert(
    manifest.head === null || typeof manifest.head === 'string',
    'head must be null or string',
  );
  assertStringArray(manifest.changedFiles, 'changedFiles');
  assert(manifest.risk && typeof manifest.risk === 'object', 'risk is required');
  assert(RISK_LEVELS.has(manifest.risk.level), `unsupported risk level ${manifest.risk.level}`);
  assertStringArray(manifest.risk.reasons, 'risk.reasons');
  assert(manifest.scope && typeof manifest.scope === 'object', 'scope is required');
  assert(manifest.scope.version === 1, 'scope version must be 1');
  assert(manifest.lanes && typeof manifest.lanes === 'object', 'lanes is required');
  for (const [lane, enabled] of Object.entries(manifest.lanes)) {
    assert(LANE_NAMES.has(lane), `unsupported lane ${lane}`);
    assert(typeof enabled === 'boolean', `lane ${lane} must be boolean`);
  }
  assert(manifest.provenance && typeof manifest.provenance === 'object', 'provenance is required');
  assertString(manifest.provenance.generator, 'provenance.generator');
  assertString(manifest.provenance.inputDigest, 'provenance.inputDigest');
  return manifest;
}

export function validateLaneInput(input) {
  assert(input && typeof input === 'object', 'lane input must be an object');
  assert(input.kind === 'lane-input-v1', 'kind must be lane-input-v1');
  assert(input.version === LANE_INPUT_VERSION, 'unsupported lane input version');
  assertString(input.lane, 'lane');
  assertString(input.commit, 'commit');
  assertString(input.manifestDigest, 'manifestDigest');
  assertStringArray(input.inputs, 'inputs');
  assertStringArray(input.outputs, 'outputs');
  assert(input.environment && typeof input.environment === 'object', 'environment is required');
  assert(input.cache && typeof input.cache === 'object', 'cache is required');
  assert(
    input.failurePolicy && typeof input.failurePolicy === 'object',
    'failurePolicy is required',
  );
  assertString(input.owner, 'owner');
  return input;
}

export function validateLaneResult(result) {
  assert(result && typeof result === 'object', 'lane result must be an object');
  assert(result.kind === 'lane-result-v1', 'kind must be lane-result-v1');
  assert(result.version === LANE_RESULT_VERSION, 'unsupported lane result version');
  assertString(result.lane, 'lane');
  assertString(result.commit, 'commit');
  assertString(result.manifestDigest, 'manifestDigest');
  assert(
    ['success', 'failure', 'cancelled', 'skipped'].includes(result.status),
    'invalid lane status',
  );
  assert(result.failure && typeof result.failure === 'object', 'failure is required');
  assert(
    ['none', 'assertion', 'infrastructure', 'process-crash', 'timeout', 'flaky'].includes(
      result.failure.classification,
    ),
    'invalid failure classification',
  );
  assert(result.timing && typeof result.timing === 'object', 'timing is required');
  assert(result.provenance && typeof result.provenance === 'object', 'provenance is required');
  return result;
}

export function validateArtifactManifest(manifest) {
  assert(manifest && typeof manifest === 'object', 'artifact manifest must be an object');
  assert(manifest.kind === 'artifact-manifest-v1', 'kind must be artifact-manifest-v1');
  assert(manifest.version === ARTIFACT_MANIFEST_VERSION, 'unsupported artifact manifest version');
  assertString(manifest.name, 'name');
  assertString(manifest.commit, 'commit');
  assertString(manifest.digest, 'digest');
  assertString(manifest.sourceManifestDigest, 'sourceManifestDigest');
  assertString(manifest.path, 'path');
  assertString(manifest.createdBy, 'createdBy');
  return manifest;
}

export function buildProvenance({ generator, input }) {
  return {
    generator,
    inputDigest: digest(input),
  };
}
