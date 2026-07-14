/**
 * Runtime profile loader (SSOT for host ports / lanes).
 * @module tools/runtime/load-profiles
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROFILES_PATH = resolve(__dirname, 'profiles.json');

/**
 * @typedef {object} RuntimeProfile
 * @property {string} title
 * @property {string} [description]
 * @property {Record<string, string>} [commands]
 * @property {Record<string, number>} ports
 * @property {Record<string, number>} [hostPortEnv]
 * @property {Record<string, string>} [urls]
 * @property {string} [runtimeLane]
 * @property {string[]} [mutexWith]
 */

/**
 * @typedef {object} RuntimeProfilesDocument
 * @property {number} version
 * @property {string} [description]
 * @property {Record<string, string[]>} reservedHostPorts
 * @property {Record<string, RuntimeProfile>} profiles
 */

/** @type {RuntimeProfilesDocument | null} */
let cached = null;

/**
 * @returns {RuntimeProfilesDocument}
 */
export function loadRuntimeProfiles() {
  if (cached) {
    return cached;
  }

  const raw = readFileSync(PROFILES_PATH, 'utf8');
  cached = JSON.parse(raw);
  return cached;
}

/**
 * @param {string} name
 * @returns {RuntimeProfile}
 */
export function getRuntimeProfile(name) {
  const doc = loadRuntimeProfiles();
  const profile = doc.profiles[name];
  if (!profile) {
    const known = Object.keys(doc.profiles).join(', ');
    throw new Error(`Unknown runtime profile "${name}". Known: ${known}`);
  }
  return profile;
}

/**
 * Host ports claimed by every profile except the named one.
 * @param {string} profileName
 * @returns {Map<number, string[]>}
 */
export function getPortsClaimedOutside(profileName) {
  const doc = loadRuntimeProfiles();
  /** @type {Map<number, string[]>} */
  const claimed = new Map();

  for (const [name, profile] of Object.entries(doc.profiles)) {
    if (name === profileName) {
      continue;
    }
    for (const port of Object.values(profile.ports ?? {})) {
      const list = claimed.get(port) ?? [];
      list.push(name);
      claimed.set(port, list);
    }
  }

  return claimed;
}

/**
 * Resolve local-docker host port env map strictly from SSOT.
 * Any differing env values are forced back to SSOT so local stack never drifts.
 * @param {Record<string, string | number | undefined>} hostPortEnv
 * @returns {{ ok: boolean, forced: Record<string, string>, warnings: string[], errors: string[] }}
 */
export function resolveLocalDockerHostPorts(hostPortEnv = {}) {
  const profile = getRuntimeProfile('local-docker');
  const expected = profile.hostPortEnv ?? {};
  const claimedOutside = getPortsClaimedOutside('local-docker');

  /** @type {Record<string, string>} */
  const forced = {};
  /** @type {string[]} */
  const warnings = [];
  /** @type {string[]} */
  const errors = [];

  for (const [key, expectedPort] of Object.entries(expected)) {
    const expectedValue = String(expectedPort);
    const raw = hostPortEnv[key];
    const current = raw === undefined || raw === null || raw === '' ? null : String(raw).trim();

    if (!current) {
      forced[key] = expectedValue;
      warnings.push(`${key} is unset; using SSOT value ${expectedValue}`);
      continue;
    }

    if (current === expectedValue) {
      forced[key] = expectedValue;
      continue;
    }

    const numeric = Number(current);
    const collides = Number.isFinite(numeric) && claimedOutside.has(numeric);
    const reason = collides
      ? `collides with reserved host port for [${claimedOutside.get(numeric)?.join(', ')}]`
      : 'differs from SSOT local-docker contract';

    warnings.push(`${key}=${current} ${reason}; forcing SSOT ${expectedValue}`);
    forced[key] = expectedValue;
  }

  return {
    ok: errors.length === 0,
    forced,
    warnings,
    errors,
  };
}

/**
 * @param {string} profileName
 * @returns {string[]}
 */
export function listProfileSummaries(profileName) {
  const profile = getRuntimeProfile(profileName);
  const lines = [
    `profile: ${profileName} — ${profile.title}`,
    profile.description ? `  ${profile.description}` : null,
  ].filter(Boolean);

  for (const [name, port] of Object.entries(profile.ports ?? {})) {
    lines.push(`  port.${name}=${port}`);
  }
  for (const [name, url] of Object.entries(profile.urls ?? {})) {
    lines.push(`  url.${name}=${url}`);
  }
  for (const [name, command] of Object.entries(profile.commands ?? {})) {
    lines.push(`  cmd.${name}=${command}`);
  }
  if (profile.mutexWith?.length) {
    lines.push(`  mutexWith=${profile.mutexWith.join(', ')}`);
  }
  return lines;
}

export { PROFILES_PATH };
