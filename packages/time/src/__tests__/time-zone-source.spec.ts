import { describe, expect, it } from 'vitest';
import {
  createFixedTimeZoneSource,
  isIanaTimeZoneId,
  resolveTimeZoneId,
} from '../index';

describe('IANA timezone resolution input source (TIME-1101)', () => {
  it('resolves local through an injected source instead of hiding host state in recurrence code', () => {
    const source = createFixedTimeZoneSource('America/New_York');
    expect(resolveTimeZoneId('local', source)).toBe('America/New_York');
  });

  it('accepts valid IANA zones and rejects invalid zones', () => {
    expect(isIanaTimeZoneId('Asia/Tokyo')).toBe(true);
    expect(resolveTimeZoneId('UTC')).toBe('UTC');
    expect(isIanaTimeZoneId('Mars/Olympus_Mons')).toBe(false);
    expect(() => resolveTimeZoneId('Mars/Olympus_Mons')).toThrow(TypeError);
  });
});
