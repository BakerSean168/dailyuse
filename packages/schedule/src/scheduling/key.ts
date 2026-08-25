import type { SchedulingOwner } from './contracts';
import { assertSchedulingKey, assertSchedulingOwner } from './validation';

function encodeSegment(segment: string): string {
  if (segment.length === 0) {
    throw new TypeError('Scheduling key segments must be non-empty.');
  }
  if (segment !== segment.trim()) {
    throw new TypeError('Scheduling key segments must not contain edge whitespace.');
  }
  return `${segment.length}:${segment}`;
}

/**
 * Collision-free canonical schedulingKey builder. Length prefixes make values
 * such as ["a:b", "c"] distinct from ["a", "b:c"].
 */
export function buildSchedulingKey(...segments: readonly string[]): string {
  if (segments.length === 0) {
    throw new TypeError('At least one scheduling key segment is required.');
  }
  const key = `sk:v1:${segments.map(encodeSegment).join(':')}`;
  assertSchedulingKey(key);
  return key;
}

/** Stable storage/lock key for one complete owner desired set. */
export function buildSchedulingOwnerKey(owner: SchedulingOwner): string {
  assertSchedulingOwner(owner);
  return `owner:v1:${encodeSegment(owner.identityId)}:${encodeSegment(owner.type)}:${encodeSegment(owner.id)}`;
}
