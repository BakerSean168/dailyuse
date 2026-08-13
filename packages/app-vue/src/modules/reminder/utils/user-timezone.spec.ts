import { describe, expect, it } from 'vitest';
import { getUserTimezone } from './user-timezone';

describe('getUserTimezone', () => {
  it('returns a valid string timezone or null without throwing exception', () => {
    const tz = getUserTimezone();
    if (tz !== null) {
      expect(typeof tz).toBe('string');
      expect(tz.length).toBeGreaterThan(0);
    } else {
      expect(tz).toBeNull();
    }
  });
});
