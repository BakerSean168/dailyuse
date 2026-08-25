import type { TimeZoneId, TimeZonePolicy } from '../types';

/**
 * Explicit input source for the host/user IANA zone.
 * Recurrence code consumes a resolved IANA id rather than reading host state ad hoc.
 */
export interface TimeZoneSource {
  currentTimeZoneId(): TimeZoneId;
}

export function isIanaTimeZoneId(value: string): value is TimeZoneId {
  if (value.length === 0 || value === 'local') return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(0);
    return true;
  } catch {
    return false;
  }
}

export function createSystemTimeZoneSource(): TimeZoneSource {
  return {
    currentTimeZoneId(): TimeZoneId {
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!zone || !isIanaTimeZoneId(zone)) {
        throw new TypeError(`Host did not provide a valid IANA time zone: ${String(zone)}`);
      }
      return zone;
    },
  };
}

export function createFixedTimeZoneSource(timeZoneId: TimeZoneId): TimeZoneSource {
  if (!isIanaTimeZoneId(timeZoneId)) {
    throw new TypeError(`Invalid IANA time zone: ${timeZoneId}`);
  }
  return {
    currentTimeZoneId: () => timeZoneId,
  };
}

const systemTimeZoneSource = createSystemTimeZoneSource();

export function resolveTimeZoneId(
  policy: TimeZonePolicy,
  source: TimeZoneSource = systemTimeZoneSource,
): TimeZoneId {
  const zone = policy === 'local' ? source.currentTimeZoneId() : policy;
  if (!isIanaTimeZoneId(zone)) {
    throw new TypeError(`Invalid IANA time zone: ${zone}`);
  }
  return zone;
}
