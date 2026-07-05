/**
 * Generic branded-ID test fixtures.
 *
 * Produces deterministic prefixed UUID strings so tests can stay readable,
 * repeatable, and aligned with the runtime `Prefix_uuid` contract.
 */

import { generateUUID } from '../helpers/random.js';

function normalizeHexSeed(seed: string | number): string {
  if (typeof seed === 'number') {
    return Math.abs(seed).toString(16) || '1';
  }

  const encoded = Buffer.from(seed, 'utf8').toString('hex').toLowerCase();
  return encoded || '1';
}

function repeatHex(hex: string, length: number): string {
  let output = '';
  while (output.length < length) {
    output += hex;
  }
  return output.slice(0, length);
}

/**
 * Create a valid v4-like UUID from a deterministic seed.
 */
export function aUuid(seed?: string | number): string {
  if (seed == null) {
    return generateUUID();
  }

  const hex = repeatHex(normalizeHexSeed(seed), 32);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `8${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join('-');
}

/**
 * Create a `Prefix_uuid` test value that passes the shared branded-ID contract.
 */
export function aPrefixedUuid(prefix: string, seed?: string | number): string {
  return `${prefix}_${aUuid(seed)}`;
}
